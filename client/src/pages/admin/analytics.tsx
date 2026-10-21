import { useState, type CSSProperties } from "react";
import { App, Button, Input, Modal } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { errorMessage } from "../../lib/errors";
import { formatDate, formatMoney, formatNumber, SOURCE_LABEL, timeAgo } from "../../lib/format";
import { periodDelta, shareLabel, toneIndex } from "../../lib/insights";
import { CountUp, Reveal } from "../../lib/motion";
import { useInView } from "../../lib/useMotion";
import { paletteFor } from "../../lib/palette";
import GivingChart, { Sparkline } from "../../components/GivingChart";
import CampaignCover from "../../components/CampaignCover";
import { Avatar, Container, DashboardSkeleton, DeltaChip, EmptyState, PageHeader, ProgressBar, Stat } from "../../components/ui";

const SOURCE_COLOR: Record<string, string> = { seed: "#2b4f4f", mock: "#f0a43a", stripe: "#a6d1ff", simulated: "#8a9592" };

function CategoryBars({ rows, total }: { rows: { category: string; raised: number; donations: number }[]; total: number }) {
  const { ref, inView } = useInView<HTMLUListElement>();
  const max = Math.max(1, ...rows.map((r) => r.raised));
  return (
    <ul ref={ref} className="mt-6 list-none space-y-4 p-0">
      {rows.map((r, i) => (
        <li key={r.category} className="grid grid-cols-[minmax(7rem,11.5rem)_1fr_auto] items-center gap-4 text-sm">
          <span className="flex items-center gap-2 truncate text-ink">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: paletteFor(r.category)[1] }} />
            <span className="truncate">{r.category}</span>
          </span>
          <span className="relative h-3 overflow-hidden rounded-full bg-paper-2">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${inView ? "grow-x" : "scale-x-0"}`}
              style={{ width: `${(r.raised / max) * 100}%`, background: paletteFor(r.category)[1], "--d": `${i * 90}ms` } as CSSProperties}
            />
          </span>
          <span className="tabular w-24 text-right">
            <span className="font-semibold text-ink">{formatMoney(r.raised)}</span>
            <span className="block text-xs text-faint">{Math.round((r.raised / Math.max(1, total)) * 100)}% · {r.donations} gifts</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Share of money by source as a ring, drawn in when it scrolls into view. */
function SourceRing({ rows, total }: { rows: { source: string; raised: number }[]; total: number }) {
  const { ref, inView } = useInView<SVGSVGElement>();
  const r = 62;
  const c = 2 * Math.PI * r;
  let start = 0;
  return (
    <svg ref={ref} viewBox="0 0 160 160" className="h-44 w-44 shrink-0 -rotate-90" role="img" aria-label="Share of money by payment source">
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-paper-2)" strokeWidth="14" />
      {inView &&
        rows.map((s, i) => {
          const len = (s.raised / total) * c;
          const seg = (
            <circle
              key={s.source}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={SOURCE_COLOR[s.source] || "#8a9592"}
              strokeWidth="14"
              strokeLinecap={len > 8 ? "butt" : "round"}
              strokeDashoffset={-start}
              className="arc-draw"
              style={{ "--len": `${Math.max(len, 0.01)}px`, "--c": `${c}px`, "--d": `${150 + i * 220}ms` } as CSSProperties}
            />
          );
          start += len;
          return seg;
        })}
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const { message } = App.useApp();
  const { data, loading, error, reload } = useAsync(() => api.adminAnalytics(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; title: string } | null>(null);
  const [reason, setReason] = useState("");

  const act = async (id: string, action: "approve" | "reject", why = "") => {
    setBusy(id + action);
    try {
      await api.adminCampaignAction(id, action, why);
      message.success(action === "approve" ? "Approved. The campaign is now public." : "Rejected. The organiser can see the reason.");
      reload();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const actions = (
    <>
      <Link to="/admin/campaigns" className="press">
        <Button shape="round" size="large">
          Manage campaigns
        </Button>
      </Link>
      <Link to="/users" className="press">
        <Button shape="round" size="large">
          Users
        </Button>
      </Link>
    </>
  );

  if (error) {
    return (
      <Container className="py-12">
        <EmptyState title="Couldn't load analytics" tone="rose">
          {errorMessage(error)}
        </EmptyState>
      </Container>
    );
  }

  const raised7 = data ? periodDelta(data.daily, 7) : null;
  const gifts7 = data ? periodDelta(data.daily.map((d) => ({ amount: d.count })), 7) : null;
  const sourceTotal = data ? Math.max(1, data.bySource.reduce((s, x) => s + x.raised, 0)) : 1;

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader kicker="Admin · platform analytics" title="The whole ledger, at a glance" actions={actions}>
        Computed from completed donations, so these numbers always match the campaign pages and organiser dashboards.
      </PageHeader>

      {loading && !data ? (
        <DashboardSkeleton label="Loading analytics" />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" data-testid="admin-totals">
            <Stat
              accent
              className="reveal col-span-2 sm:col-span-1"
              label="Total raised"
              value={<CountUp value={data.totals.raised} format={formatMoney} />}
              hint={
                <span className="flex flex-wrap items-center gap-2">
                  {formatMoney(data.totals.raisedLast30Days)} in 30 days <DeltaChip change={raised7?.change ?? null} dark />
                </span>
              }
              extra={<Sparkline values={data.daily.map((d) => d.amount)} className="pointer-events-none absolute right-5 top-4 h-8 w-24 opacity-80" />}
            />
            <Stat
              className="reveal"
              label="Gifts"
              value={<CountUp value={data.totals.donations} format={formatNumber} />}
              hint={
                <span className="flex flex-wrap items-center gap-2">
                  avg {formatMoney(data.totals.averageDonation)} <DeltaChip change={gifts7?.change ?? null} />
                </span>
              }
            />
            <Stat
              className="reveal"
              label="Campaigns"
              value={
                <>
                  {data.totals.campaigns.live} <span className="text-[0.55em] font-medium text-muted">live</span>
                </>
              }
              hint={`${data.totals.campaigns.funded} funded · ${data.totals.campaigns.total} total`}
            />
            <Stat
              className="reveal col-span-2 sm:col-span-1"
              label="Review queue"
              value={data.totals.campaigns.pending}
              hint={`${data.totals.users} users · ${data.totals.organisers} organisers`}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Reveal as="section" className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Giving, last 30 days</h2>
                  <p className="mt-1 text-sm text-muted">Hover a day for its total and number of gifts.</p>
                </div>
                <span className="tabular font-display text-2xl font-semibold">{formatMoney(data.totals.raisedLast30Days)}</span>
              </div>
              <div className="mt-6">
                <GivingChart data={data.daily} height={280} />
              </div>
            </Reveal>
            <Reveal as="section" delay={100} className="flex flex-col rounded-[1.6rem] border border-line bg-card p-5 sm:p-7" data-testid="review-queue">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Review queue</h2>
                <span
                  className={`tabular rounded-full px-2.5 py-0.5 text-xs font-semibold ${data.pending.length ? "bg-amber-soft text-amber-deep" : "bg-paper-2 text-muted"}`}
                >
                  {data.pending.length} waiting
                </span>
              </div>
              {data.pending.length ? (
                <ul className="mt-4 list-none space-y-3 p-0">
                  {data.pending.map((p) => (
                    <li key={p._id} className="rounded-[1.2rem] border border-line bg-paper p-4">
                      <div className="flex gap-3">
                        <CampaignCover id={p._id} category={p.EventCategory || "Other"} className="h-12 w-12 shrink-0 rounded-xl" />
                        <div className="min-w-0">
                          <Link to={`/campaigns/${p._id}`} className="link-u font-semibold text-ink no-underline">
                            {p.title}
                          </Link>
                          <div className="mt-0.5 text-xs leading-relaxed text-muted">
                            {p.organizer} · by {p.owner} · {formatMoney(p.EventTargetAmount)} goal · {formatDate(p.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button
                          type="primary"
                          shape="round"
                          icon={<CheckOutlined />}
                          className="press"
                          loading={busy === p._id + "approve"}
                          onClick={() => act(p._id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button shape="round" danger icon={<CloseOutlined />} className="press" onClick={() => setRejecting({ id: p._id, title: p.title })}>
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-moss/10 text-lg text-moss">
                    <CheckOutlined />
                  </span>
                  <div className="mt-3 font-display text-lg font-semibold">All clear</div>
                  <p className="mt-1 max-w-[16rem] text-sm text-muted">New campaigns from organisers land here for review.</p>
                </div>
              )}
              <div className="mt-auto pt-6">
                <div className="kicker text-faint">Campaign status</div>
                <dl className="tabular mt-3 grid grid-cols-4 gap-2 text-center">
                  {[
                    { k: "Taking gifts", v: data.totals.campaigns.live, c: "bg-moss" },
                    { k: "Goal met", v: data.totals.campaigns.funded, c: "bg-amber" },
                    { k: "In review", v: data.totals.campaigns.pending, c: "bg-sky" },
                    { k: "Rejected", v: data.totals.campaigns.rejected, c: "bg-rose" },
                  ].map((x) => (
                    <div key={x.k} className="rounded-2xl bg-paper px-1 py-3">
                      <dd className="font-display text-xl font-semibold leading-none">{Math.max(0, x.v)}</dd>
                      <dt className="mt-1.5 flex items-center justify-center gap-1.5 text-[0.7rem] text-muted">
                        <span className={`h-1.5 w-1.5 rounded-full ${x.c}`} />
                        {x.k}
                      </dt>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Reveal as="section" className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Raised by category</h2>
              <CategoryBars rows={data.byCategory} total={data.totals.raised} />
            </Reveal>
            <Reveal as="section" delay={100} className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Where the money came from</h2>
              <p className="mt-1 text-xs text-muted">Every source here is test or demo data. No real payments exist.</p>
              <div className="mt-6 flex flex-col items-center gap-7">
                <div className="relative">
                  <SourceRing rows={data.bySource} total={sourceTotal} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="tabular font-display text-2xl font-semibold leading-none tracking-[-0.02em]">{formatMoney(sourceTotal)}</span>
                    <span className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-faint">test money</span>
                  </div>
                </div>
                <ul className="w-full list-none space-y-4 p-0">
                  {data.bySource.map((s) => (
                    <li key={s.source} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SOURCE_COLOR[s.source] || "#8a9592" }} />
                        <span>
                          <span className="font-medium text-ink">{SOURCE_LABEL[s.source] || s.source}</span>
                          <span className="block text-xs text-faint">
                            {formatNumber(s.donations)} gift{s.donations === 1 ? "" : "s"}
                          </span>
                        </span>
                      </span>
                      <span className="tabular text-right">
                        <span className="font-semibold">{formatMoney(s.raised)}</span>
                        <span className="block text-xs text-faint">{shareLabel(s.raised, sourceTotal)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Reveal as="section" className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Top campaigns</h2>
              <ol className="mt-5 list-none space-y-5 p-0">
                {data.topCampaigns.map((c, i) => (
                  <li key={c._id} className="flex items-center gap-4">
                    <span className="w-6 font-display text-2xl font-semibold italic text-amber-deep">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3 text-sm">
                        <Link to={`/campaigns/${c._id}`} className="link-u truncate font-semibold text-ink no-underline">
                          {c.title}
                        </Link>
                        <span className="tabular shrink-0 font-semibold">{formatMoney(c.raised)}</span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar percent={c.percent} size="sm" delay={i * 100} />
                      </div>
                      <div className="mt-1 text-xs text-faint">
                        {c.percent}% of {formatMoney(c.target)} · {c.donationCount} gifts
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal as="section" delay={100} className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Latest donations</h2>
              <ul className="mt-3 list-none divide-y divide-line p-0">
                {data.recentDonations.slice(0, 6).map((d) => (
                  <li key={d._id} className="flex items-center gap-3 py-3 text-sm">
                    <Avatar name={d.donorName} toneIndex={toneIndex(d.donorName, 6)} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{d.donorName}</div>
                      <div className="truncate text-xs text-muted">
                        {d.campaignTitle} · {timeAgo(d.createdAt)} · {SOURCE_LABEL[d.source] || d.source}
                      </div>
                    </div>
                    <span className="tabular shrink-0 font-display text-base font-semibold">{formatMoney(d.amount)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </>
      ) : null}

      <Modal
        open={Boolean(rejecting)}
        title={<span className="font-display text-xl">Reject &ldquo;{rejecting?.title}&rdquo;?</span>}
        okText="Reject campaign"
        okButtonProps={{ danger: true, loading: Boolean(busy), shape: "round" }}
        cancelButtonProps={{ shape: "round" }}
        onCancel={() => setRejecting(null)}
        onOk={async () => {
          if (!rejecting) return;
          await act(rejecting.id, "reject", reason.trim());
          setRejecting(null);
          setReason("");
        }}
      >
        <p className="text-muted">The organiser sees this reason on their campaign page.</p>
        <Input.TextArea rows={3} maxLength={300} showCount value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
      </Modal>
    </Container>
  );
}
