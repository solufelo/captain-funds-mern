import type { CSSProperties } from "react";
import { Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { daysLeftLabel, formatMoney, formatNumber, percentFunded, timeAgo } from "../../lib/format";
import { periodDelta, toneIndex } from "../../lib/insights";
import { CountUp, Reveal } from "../../lib/motion";
import userStore from "../../store/users-store";
import GivingChart, { Sparkline } from "../../components/GivingChart";
import CampaignCover from "../../components/CampaignCover";
import { Avatar, Container, DashboardSkeleton, DeltaChip, EmptyState, PageHeader, ProgressBar, Stat, StateBadge } from "../../components/ui";

export default function OrganiserDashboard() {
  const { currentUser } = userStore();
  const { data, loading, error } = useAsync(() => api.myDashboard(), []);
  const today = new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" });

  const newButton = (
    <Link to="/campaigns/new" className="press">
      <Button type="primary" size="large" shape="round" icon={<PlusOutlined />}>
        Start a campaign
      </Button>
    </Link>
  );

  const raised7 = data ? periodDelta(data.daily, 7) : null;
  const gifts7 = data ? periodDelta(data.daily.map((d) => ({ amount: d.count })), 7) : null;
  const monthTotal = data ? data.daily.reduce((s, d) => s + d.amount, 0) : 0;
  const best = data?.daily.reduce((b, d) => (d.amount > b.amount ? d : b), data.daily[0]);

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader kicker={today} title={`Hi, ${currentUser?.name.split(" ")[0] || "there"}`} actions={newButton}>
        Everything raised across your campaigns, straight from the donation ledger.
      </PageHeader>

      {error ? (
        <EmptyState title="Couldn't load your dashboard" tone="rose">
          Refresh the page, or sign in again if your session expired.
        </EmptyState>
      ) : loading && !data ? (
        <DashboardSkeleton label="Loading your dashboard" />
      ) : data && data.campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" action={newButton}>
          Start one in a couple of minutes. An admin reviews it before it goes public.
        </EmptyState>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" data-testid="organiser-totals">
            <Stat
              accent
              className="reveal col-span-2 sm:col-span-1"
              label="Total raised"
              value={<CountUp value={data.totals.raised} format={formatMoney} />}
              hint={
                <>
                  <div className="mb-2 mt-3">
                    <ProgressBar percent={(data.totals.raised / Math.max(1, data.totals.totalGoal)) * 100} size="sm" track="dark" />
                  </div>
                  of {formatMoney(data.totals.totalGoal)} in approved goals
                </>
              }
              extra={<Sparkline values={data.daily.map((d) => d.amount)} className="pointer-events-none absolute right-5 top-4 h-8 w-24 opacity-80" />}
            />
            <Stat
              className="reveal"
              label="Gifts"
              value={<CountUp value={data.totals.donations} format={formatNumber} />}
              hint={<DeltaChip change={gifts7?.change ?? null} />}
            />
            <Stat className="reveal" label="Average gift" value={<CountUp value={data.totals.averageDonation} format={formatMoney} />} />
            <Stat
              className="reveal col-span-2 sm:col-span-1"
              label="Live campaigns"
              value={data.totals.liveCampaigns}
              hint={data.totals.pendingCampaigns ? `${data.totals.pendingCampaigns} waiting for review` : "None waiting for review"}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Reveal as="section" className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Last 30 days</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                    <span className="tabular font-display text-2xl font-semibold text-ink">{formatMoney(monthTotal)}</span>
                    <DeltaChip change={raised7?.change ?? null} />
                  </div>
                </div>
                {best && best.amount > 0 && (
                  <div className="text-right text-xs text-muted">
                    <div className="kicker text-faint">Best day</div>
                    <div className="tabular mt-1 text-sm font-semibold text-ink">
                      {new Date(`${best.date}T12:00:00`).toLocaleDateString("en-CA", { month: "short", day: "numeric" })} ·{" "}
                      {formatMoney(best.amount)}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <GivingChart data={data.daily} height={290} />
              </div>
            </Reveal>
            <Reveal as="section" delay={100} className="rounded-[1.6rem] border border-line bg-card p-5 sm:p-7">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Latest gifts</h2>
                <span className="text-xs text-muted">live from the ledger</span>
              </div>
              <ul className="mt-3 list-none divide-y divide-line p-0">
                {data.recentDonations.slice(0, 6).map((d, i) => (
                  <li key={d._id} className="supporter flex items-center gap-3 py-3 text-sm" style={{ "--i": i } as CSSProperties}>
                    <Avatar name={d.donorName} toneIndex={toneIndex(d.donorName, 6)} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-ink">{d.donorName}</div>
                      <div className="truncate text-xs text-muted">
                        {d.campaignTitle} · {timeAgo(d.createdAt)}
                      </div>
                    </div>
                    <span className="tabular shrink-0 font-display text-base font-semibold">{formatMoney(d.amount)}</span>
                  </li>
                ))}
                {!data.recentDonations.length && <li className="py-6 text-center text-sm text-muted">No gifts yet. Share your campaign link to get the first one.</li>}
              </ul>
            </Reveal>
          </div>

          <section className="mt-14">
            <Reveal className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-step-2 font-semibold tracking-[-0.02em]">Your campaigns</h2>
              <span className="text-sm text-muted">{data.campaigns.length} total</span>
            </Reveal>
            <ul className="mt-5 grid list-none gap-3 p-0" data-testid="my-campaigns">
              {data.campaigns.map((c, i) => (
                <Reveal as="li" key={c._id} delay={i * 70}>
                  <Link
                    to={`/campaigns/${c._id}`}
                    className="lift group flex flex-col gap-4 rounded-[1.4rem] border border-line bg-card p-3 pr-4 text-ink no-underline sm:flex-row sm:items-center sm:pr-6"
                  >
                    <div className="overflow-hidden rounded-[1rem] sm:w-44">
                      <CampaignCover id={c._id} category={c.EventCategory} image={c.image} className="aspect-[16/9] w-full shrink-0" />
                    </div>
                    <div className="min-w-0 flex-1 px-1 sm:px-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StateBadge campaign={c} />
                        <span className="text-xs text-muted">{c.EventCategory}</span>
                      </div>
                      <div className="mt-1.5 truncate font-display text-xl font-semibold tracking-[-0.02em]">{c.title}</div>
                      <div className="mt-3 max-w-xl">
                        <ProgressBar percent={percentFunded(c)} size="sm" />
                      </div>
                    </div>
                    <div className="tabular grid shrink-0 grid-cols-3 gap-4 px-1 text-sm sm:w-80 sm:px-0 sm:text-right">
                      <div>
                        <div className="font-display text-lg font-semibold leading-tight">{formatMoney(c.EventCurrentAmount)}</div>
                        <div className="text-xs text-muted">of {formatMoney(c.EventTargetAmount)}</div>
                      </div>
                      <div>
                        <div className="font-display text-lg font-semibold leading-tight">{c.donationCount ?? 0}</div>
                        <div className="text-xs text-muted">gifts</div>
                      </div>
                      <div>
                        <div className="font-display text-lg font-semibold leading-tight">{c.isApproved ? daysLeftLabel(c.endDate).replace(" left", "") : "—"}</div>
                        <div className="text-xs text-muted">{c.isApproved ? "remaining" : "after approval"}</div>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </Container>
  );
}
