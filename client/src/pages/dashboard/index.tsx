import { Button, Skeleton } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { daysLeftLabel, formatMoney, formatNumber, percentFunded, timeAgo } from "../../lib/format";
import userStore from "../../store/users-store";
import GivingChart from "../../components/GivingChart";
import CampaignCover from "../../components/CampaignCover";
import { Container, EmptyState, PageHeader, ProgressBar, Stat, StateBadge } from "../../components/ui";

export default function OrganiserDashboard() {
  const { currentUser } = userStore();
  const { data, loading, error } = useAsync(() => api.myDashboard(), []);

  const newButton = (
    <Link to="/campaigns/new">
      <Button type="primary" size="large" shape="round" icon={<PlusOutlined />}>
        Start a campaign
      </Button>
    </Link>
  );

  return (
    <Container className="py-12">
      <PageHeader kicker="Organiser dashboard" title={`Hi, ${currentUser?.name.split(" ")[0] || "there"}`} actions={newButton}>
        Everything raised across your campaigns, straight from the donation ledger.
      </PageHeader>

      {error ? (
        <EmptyState title="Couldn't load your dashboard">Refresh the page, or sign in again if your session expired.</EmptyState>
      ) : loading && !data ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : data && data.campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" action={newButton}>
          Start one in a couple of minutes. An admin reviews it before it goes public.
        </EmptyState>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="organiser-totals">
            <Stat accent label="Total raised" value={formatMoney(data.totals.raised)} hint={`of ${formatMoney(data.totals.totalGoal)} in approved goals`} />
            <Stat label="Donations" value={formatNumber(data.totals.donations)} />
            <Stat label="Average gift" value={formatMoney(data.totals.averageDonation)} />
            <Stat
              label="Live campaigns"
              value={data.totals.liveCampaigns}
              hint={data.totals.pendingCampaigns ? `${data.totals.pendingCampaigns} waiting for review` : "None waiting for review"}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-3xl border border-line bg-card p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-semibold">Last 30 days</h2>
                <span className="tabular text-sm text-muted">{formatMoney(data.daily.reduce((s, d) => s + d.amount, 0))}</span>
              </div>
              <div className="mt-4">
                <GivingChart data={data.daily} height={300} />
              </div>
            </section>
            <section className="rounded-3xl border border-line bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Latest gifts</h2>
              <ul className="mt-3 divide-y divide-line">
                {data.recentDonations.slice(0, 6).map((d) => (
                  <li key={d._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink">{d.donorName}</div>
                      <div className="truncate text-xs text-muted">
                        {d.campaignTitle} · {timeAgo(d.createdAt)}
                      </div>
                    </div>
                    <span className="tabular shrink-0 font-semibold">{formatMoney(d.amount)}</span>
                  </li>
                ))}
                {!data.recentDonations.length && <li className="py-3 text-sm text-muted">No gifts yet.</li>}
              </ul>
            </section>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold">Your campaigns</h2>
            <ul className="mt-4 grid gap-4" data-testid="my-campaigns">
              {data.campaigns.map((c) => (
                <li key={c._id}>
                  <Link
                    to={`/campaigns/${c._id}`}
                    className="lift flex flex-col gap-4 rounded-3xl border border-line bg-card p-4 text-ink no-underline sm:flex-row sm:items-center"
                  >
                    <CampaignCover id={c._id} category={c.EventCategory} image={c.image} className="aspect-[16/10] w-full shrink-0 rounded-2xl sm:w-40" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StateBadge campaign={c} />
                        <span className="text-xs text-muted">{c.EventCategory}</span>
                      </div>
                      <div className="mt-1 truncate font-display text-xl font-semibold">{c.title}</div>
                      <div className="mt-3 max-w-xl">
                        <ProgressBar percent={percentFunded(c)} size="sm" />
                      </div>
                    </div>
                    <div className="tabular grid shrink-0 grid-cols-3 gap-4 text-sm sm:w-80 sm:text-right">
                      <div>
                        <div className="font-semibold">{formatMoney(c.EventCurrentAmount)}</div>
                        <div className="text-xs text-muted">of {formatMoney(c.EventTargetAmount)}</div>
                      </div>
                      <div>
                        <div className="font-semibold">{c.donationCount ?? 0}</div>
                        <div className="text-xs text-muted">gifts</div>
                      </div>
                      <div>
                        <div className="font-semibold">{c.isApproved ? daysLeftLabel(c.endDate) : "—"}</div>
                        <div className="text-xs text-muted">{c.isApproved ? "remaining" : "after approval"}</div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </Container>
  );
}
