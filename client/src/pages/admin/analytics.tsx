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

const DAY = 24 * 60 * 60 * 1000;
const BANDS: Record<number, { label: string; color: string }> = {
  0: { label: "Under $25", color: "#f6d7a4" },
  25: { label: "$25 to $99", color: "#f0a43a" },
  100: { label: "$100 to $249", color: "#b8701a" },
  250: { label: "$250 and up", color: "#2b4f4f" },
};

function CategoryBars({ rows, total }: { rows: { category: string; raised: number; donations: number }[]; total: number }) {
  const { ref, inView } = useInView<HTMLUListElement>();
  const max = Math.max(1, ...rows.map((r) => r.raised));
  return (
    <ul ref={ref} className="mt-6 list-none space-y-4 p-0">
      {rows.map((r, i) => (
        <li key={r.category} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(8rem,13.5rem)_1fr_auto]">
          <span className="flex items-center gap-2 truncate text-ink">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: paletteFor(r.category)[1] }} />
            <span className="truncate">{r.category}</span>
          </span>
          <span className="relative col-span-2 h-3 overflow-hidden rounded-full bg-paper-2 sm:col-span-1">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${inView ? "grow-x" : "scale-x-0"}`}
              style={{ width: `${(r.raised / max) * 100}%`, background: paletteFor(r.category)[1], "--d": `${i * 90}ms` } as CSSProperties}
            />
          </span>
          <span className="tabular col-start-2 row-start-1 w-24 text-right sm:col-start-auto sm:row-start-auto">
            <span className="font-semibold text-ink">{formatMoney(r.raised)}</span>
            <span className="block text-xs text-faint">{Math.round((r.raised / Math.max(1, total)) * 100)}% · {r.donations} gifts</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Share of money per band as a ring, drawn in when it scrolls into view. */
function ShareRing({ rows, total }: { rows: { min: number; raised: number }[]; total: number }) {
  const { ref, inView } = useInView<SVGSVGElement>();
  const r = 62;
  const c = 2 * Math.PI * r;
  let start = 0;
  return (
    <svg ref={ref} viewBox="0 0 160 160" className="h-44 w-44 shrink-0 -rotate-90" role="img" aria-label="Share of money by gift size">
      <circle cx="80" cy="80" r={r} fill="none" stroke="var(--color-paper-2)" strokeWidth="14" />
      {inView &&
        rows.map((s, i) => {
          const len = (s.raised / total) * c;
          if (!len) return null;
          const seg = (
            <circle
              key={s.min}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={BANDS[s.min]?.color || "#8a9592"}
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
  const sizeTotal = data ? Math.max(1, data.bySize.reduce((s, x) => s + x.raised, 0)) : 1;
  const oldestPending = data?.pending.reduce((t, p) => Math.min(t, new Date(p.createdAt).getTime()), Date.now());
  const waitingDays = oldestPending ? Math.floor((Date.now() - oldestPending) / DAY) : 0;

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
              className="reveal col-span-2 !pb-14 sm:col-span-1"
              label="Total raised"
              value={<CountUp value={data.totals.raised} format={formatMoney} />}
              hint={
                <span className="flex flex-wrap items-center gap-2">
                  {formatMoney(data.totals.raisedLast30Days)} in 30 days <DeltaChip change={raised7?.change ?? null} dark />
                </span>
              }
              extra={<Sparkline values={data.daily.map((d) => d.amount)} className="pointer-events-none absolute inset-x-0 bottom-0 h-11 w-full opacity-80" />}
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
              hint={
                data.pending.length
                  ? waitingDays >= 1
                    ? `Oldest waiting ${waitingDays} day${waitingDays === 1 ? "" : "s"}`
                    : "Oldest sent in today"
                  : "Nothing waiting"
              }
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
                        <CampaignCover id={p._id} category={p.EventCategory || "Other"} title={p.title} className="h-12 w-12 shrink-0 rounded-xl" />
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
                <dl className="tabular mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
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

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
            <Reveal as="section" className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Raised by category</h2>
              <CategoryBars rows={data.byCategory} total={data.totals.raised} />
            </Reveal>
            <Reveal as="section" delay={100} className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Gifts by size</h2>
              <p className="mt-1 text-xs text-muted">Share of the money raised in each gift band.</p>
              <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
                <div className="relative">
                  <ShareRing rows={data.bySize} total={sizeTotal} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="tabular font-display text-2xl font-semibold leading-none tracking-[-0.02em]">{formatMoney(data.totals.averageDonation)}</span>
                    <span className="mt-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-faint">average gift</span>
                  </div>
                </div>
                <ul className="w-full min-w-[12rem] flex-1 list-none space-y-4 p-0 sm:w-auto">
                  {data.bySize.map((s) => (
                    <li key={s.min} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BANDS[s.min]?.color }} />
                        <span>
                          <span className="font-medium text-ink">{BANDS[s.min]?.label || `$${s.min}+`}</span>
                          <span className="block text-xs text-faint">
                            {formatNumber(s.donations)} gift{s.donations === 1 ? "" : "s"}
                          </span>
                        </span>
                      </span>
                      <span className="tabular text-right">
                        <span className="font-semibold">{formatMoney(s.raised)}</span>
                        <span className="block text-xs text-faint">{shareLabel(s.raised, sizeTotal)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="w-full border-t border-line pt-4 text-xs leading-relaxed text-muted">
                  All test data, no real payments:{" "}
                  {data.bySource.map((s, i) => (
                    <span key={s.source} className="whitespace-nowrap">
                      {i > 0 && " · "}
                      {SOURCE_LABEL[s.source] || s.source} ({formatNumber(s.donations)})
                    </span>
                  ))}
                </p>
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
                      <div className="flex gap-1 text-xs text-muted">
                        <span className="truncate">{d.campaignTitle}</span>
                        <span className="shrink-0">
                          · {timeAgo(d.createdAt)}
                          {d.source !== "seed" && ` · ${SOURCE_LABEL[d.source] || d.source}`}
                        </span>
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
