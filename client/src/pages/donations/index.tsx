import { Button, Skeleton, Table, Tag } from "antd";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { useAsync } from "../../lib/hooks";
import { formatDate, formatMoney, SOURCE_LABEL } from "../../lib/format";
import type { MyDonation } from "../../interfaces";
import { Container, EmptyState, PageHeader, Stat } from "../../components/ui";

export default function DonationsPage() {
  const { data, loading, error } = useAsync(() => api.myDonations(), []);

  return (
    <Container className="py-12">
      <PageHeader kicker="Your giving" title="My donations">
        Gifts you made while signed in. Guest gifts aren't linked to an account.
      </PageHeader>
      {error ? (
        <EmptyState title="Couldn't load your donations">Refresh the page, or sign in again.</EmptyState>
      ) : loading && !data ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : data && data.donations.length ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat accent label="Total given" value={formatMoney(data.stats.totalAmount)} />
            <Stat label="Donations" value={data.stats.totalDonations} hint={`Average ${formatMoney(data.stats.averageDonation)}`} />
            <Stat label="Campaigns supported" value={data.stats.campaignsSupported} />
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card">
            <Table<MyDonation>
              rowKey="_id"
              dataSource={data.donations}
              pagination={{ pageSize: 15, hideOnSinglePage: true }}
              scroll={{ x: 640 }}
              columns={[
                {
                  title: "Campaign",
                  key: "c",
                  render: (_, d) => (
                    <Link to={`/campaigns/${d.campaignId}`} className="font-semibold text-ink">
                      {d.campaignTitle}
                    </Link>
                  ),
                },
                { title: "Amount", key: "a", width: 110, render: (_, d) => <span className="tabular font-semibold">{formatMoney(d.amount)}</span> },
                { title: "Date", key: "d", width: 140, render: (_, d) => formatDate(d.createdAt) },
                {
                  title: "Payment",
                  key: "p",
                  width: 190,
                  render: (_, d) => (
                    <Tag color={d.paymentStatus === "completed" ? "green" : d.paymentStatus === "failed" ? "red" : "default"}>
                      {SOURCE_LABEL[d.paymentProvider] || d.paymentProvider} · {d.paymentStatus}
                    </Tag>
                  ),
                },
                { title: "", key: "anon", width: 110, render: (_, d) => (d.isAnonymous ? <Tag>Anonymous</Tag> : null) },
              ]}
            />
          </div>
        </>
      ) : (
        <EmptyState
          title="No donations yet"
          action={
            <Link to="/campaigns">
              <Button type="primary" shape="round" size="large">
                Find a campaign
              </Button>
            </Link>
          }
        >
          Gifts you make while signed in will show up here.
        </EmptyState>
      )}
    </Container>
  );
}
