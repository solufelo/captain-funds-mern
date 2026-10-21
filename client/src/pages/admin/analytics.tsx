import { useState } from "react";
import { App, Button, Input, Modal, Skeleton } from "antd";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { errorMessage } from "../../lib/errors";
import { formatDate, formatMoney, formatNumber, SOURCE_LABEL, timeAgo } from "../../lib/format";
import GivingChart from "../../components/GivingChart";
import { Container, EmptyState, PageHeader, ProgressBar, Stat } from "../../components/ui";

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
      <Link to="/admin/campaigns">
        <Button shape="round">Manage campaigns</Button>
      </Link>
      <Link to="/users">
        <Button shape="round">Users</Button>
      </Link>
    </>
  );

  if (error) {
    return (
      <Container className="py-12">
        <EmptyState title="Couldn't load analytics">{errorMessage(error)}</EmptyState>
      </Container>
    );
  }

  return (
    <Container className="py-12">
      <PageHeader kicker="Admin" title="Platform analytics" actions={actions}>
        Computed from completed donations in the ledger, so these numbers always match the campaign pages and organiser
        dashboards.
      </PageHeader>

      {loading && !data ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-totals">
            <Stat accent label="Total raised" value={formatMoney(data.totals.raised)} hint={`${formatMoney(data.totals.raisedLast30Days)} in the last 30 days`} />
            <Stat label="Donations" value={formatNumber(data.totals.donations)} hint={`Average gift ${formatMoney(data.totals.averageDonation)}`} />
            <Stat
              label="Campaigns"
              value={`${data.totals.campaigns.live} live`}
              hint={`${data.totals.campaigns.funded} funded · ${data.totals.campaigns.total} total`}
            />
            <Stat
              label="Review queue"
              value={data.totals.campaigns.pending}
              hint={`${data.totals.users} users · ${data.totals.organisers} organisers`}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-3xl border border-line bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Giving, last 30 days</h2>
              <div className="mt-4">
                <GivingChart data={data.daily} height={260} />
              </div>
            </section>
            <section className="rounded-3xl border border-line bg-card p-6" data-testid="review-queue">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold">Review queue</h2>
                <span className="text-sm text-muted">{data.pending.length} waiting</span>
              </div>
              {data.pending.length ? (
                <ul className="mt-3 space-y-3">
                  {data.pending.map((p) => (
                    <li key={p._id} className="rounded-2xl border border-line bg-paper p-4">
                      <Link to={`/campaigns/${p._id}`} className="font-semibold text-ink no-underline hover:underline">
                        {p.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-muted">
                        {p.organizer} · by {p.owner} · {formatMoney(p.EventTargetAmount)} goal · {formatDate(p.createdAt)}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button size="small" type="primary" shape="round" loading={busy === p._id + "approve"} onClick={() => act(p._id, "approve")}>
                          Approve
                        </Button>
                        <Button size="small" shape="round" danger onClick={() => setRejecting({ id: p._id, title: p.title })}>
                          Reject
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">Nothing to review. New campaigns from organisers appear here.</p>
              )}
            </section>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-3xl border border-line bg-card p-6 lg:col-span-2">
              <h2 className="font-display text-xl font-semibold">Raised by category</h2>
              <div className="mt-4" style={{ height: Math.max(180, data.byCategory.length * 38) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory} layout="vertical" margin={{ left: 0, right: 64 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="category" width={128} tick={{ fill: "#5b6966", fontSize: 13 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "#efe9dd" }}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e3dccd", background: "#fffdf9" }}
                      formatter={(v: number, _n, item) => [`${formatMoney(v)} · ${item.payload.donations} gifts`, "Raised"]}
                    />
                    <Bar dataKey="raised" fill="#1a3636" radius={[0, 8, 8, 0]} barSize={18}>
                      <LabelList dataKey="raised" position="right" formatter={(v) => formatMoney(Number(v))} style={{ fill: "#102525", fontSize: 12, fontWeight: 600 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="rounded-3xl border border-line bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Where the money came from</h2>
              <p className="mt-1 text-xs text-muted">Every source here is test or demo data. No real payments exist.</p>
              <ul className="mt-4 space-y-3">
                {data.bySource.map((s) => (
                  <li key={s.source}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{SOURCE_LABEL[s.source] || s.source}</span>
                      <span className="tabular">{formatMoney(s.raised)}</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar percent={(s.raised / Math.max(1, data.totals.raised)) * 100} size="sm" tone="sky" />
                    </div>
                    <div className="mt-1 text-xs text-faint">
                      {formatNumber(s.donations)} donation{s.donations === 1 ? "" : "s"}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-line bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Top campaigns</h2>
              <ol className="mt-4 space-y-4">
                {data.topCampaigns.map((c, i) => (
                  <li key={c._id} className="flex gap-4">
                    <span className="w-6 font-display text-xl font-semibold text-amber">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3 text-sm">
                        <Link to={`/campaigns/${c._id}`} className="truncate font-semibold text-ink no-underline hover:underline">
                          {c.title}
                        </Link>
                        <span className="tabular shrink-0">{formatMoney(c.raised)}</span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar percent={c.percent} size="sm" />
                      </div>
                      <div className="mt-1 text-xs text-faint">
                        {c.percent}% of {formatMoney(c.target)} · {c.donationCount} gifts
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="rounded-3xl border border-line bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Latest donations</h2>
              <ul className="mt-3 divide-y divide-line">
                {data.recentDonations.map((d) => (
                  <li key={d._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{d.donorName}</div>
                      <div className="truncate text-xs text-muted">
                        {d.campaignTitle} · {timeAgo(d.createdAt)} · {SOURCE_LABEL[d.source] || d.source}
                      </div>
                    </div>
                    <span className="tabular shrink-0 font-semibold">{formatMoney(d.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : null}

      <Modal
        open={Boolean(rejecting)}
        title={`Reject "${rejecting?.title}"?`}
        okText="Reject campaign"
        okButtonProps={{ danger: true, loading: Boolean(busy) }}
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
