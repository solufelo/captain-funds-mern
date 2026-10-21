import { useEffect, useState } from "react";
import { Alert, Button, Skeleton } from "antd";
import { ArrowLeftOutlined, EnvironmentOutlined, HeartFilled } from "@ant-design/icons";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import { useAsync, useCampaignLive } from "../../lib/hooks";
import { daysLeftLabel, formatDate, formatMoney, percentFunded, timeAgo } from "../../lib/format";
import { errorMessage } from "../../lib/errors";
import CampaignCover from "../../components/CampaignCover";
import DonationModal from "../../components/DonationModal";
import { Container, DemoTag, EmptyState, ProgressBar, StateBadge } from "../../components/ui";

export default function CampaignDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);
  const { data, error, loading, reload } = useAsync(() => api.getCampaign(id), [id]);

  useCampaignLive(id, reload);

  // Returning from Stripe Checkout (test mode).
  useEffect(() => {
    const outcome = params.get("donation");
    const sessionId = params.get("session_id");
    if (!outcome) return;
    const clear = () => setParams({}, { replace: true });
    if (outcome === "cancelled") {
      setNotice({ type: "info", text: "Checkout cancelled. No donation was made." });
      clear();
    } else if (outcome === "success" && sessionId) {
      api
        .verifyStripe(sessionId)
        .then((r) => {
          setNotice(
            r.status === "completed"
              ? { type: "success", text: `Thanks! Your ${formatMoney(r.donation.amount)} test donation is confirmed.` }
              : { type: "info", text: "Payment is still processing. This page will update when it clears." },
          );
          reload();
        })
        .catch((e) => setNotice({ type: "error", text: errorMessage(e) }))
        .finally(clear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <Container className="py-20">
        <EmptyState title="Campaign not found" action={<Link to="/campaigns">Browse campaigns</Link>}>
          It may have been removed, or it is still waiting for admin review.
        </EmptyState>
      </Container>
    );
  }
  if (loading && !data) {
    return (
      <Container className="py-12">
        <div className="aspect-[21/9] w-full rounded-3xl bg-paper-2" />
        <Skeleton active className="mt-8" paragraph={{ rows: 6 }} />
      </Container>
    );
  }
  if (!data) return null;

  const { campaign: c, recentDonations, canDonate, viewerIsOwner } = data;
  const pct = percentFunded(c);
  const remaining = Math.max(0, c.EventTargetAmount - c.EventCurrentAmount);

  return (
    <Container className="py-8 md:py-12">
      <Link to="/campaigns" className="inline-flex items-center gap-2 text-sm font-medium text-muted no-underline hover:text-ink">
        <ArrowLeftOutlined /> All campaigns
      </Link>

      {notice && <Alert className="mt-4" type={notice.type} showIcon message={notice.text} closable onClose={() => setNotice(null)} />}
      {!c.isApproved && !c.isRejected && (
        <Alert
          className="mt-4"
          type="info"
          showIcon
          message="In review"
          description={
            viewerIsOwner
              ? "Only you and platform admins can see this page until an admin approves it."
              : "Admin preview: this campaign is waiting for review."
          }
        />
      )}
      {c.isRejected && (
        <Alert className="mt-4" type="error" showIcon message="Rejected" description={c.rejectionReason || "This campaign was not approved."} />
      )}

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        <article className="min-w-0">
          <CampaignCover id={c._id} category={c.EventCategory} image={c.image} title={c.title} className="aspect-[16/9] w-full rounded-3xl" />
          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-full bg-paper-2 px-3 py-1 font-medium text-ink">{c.EventCategory}</span>
            <span className="inline-flex items-center gap-1">
              <EnvironmentOutlined /> {c.location}
            </span>
            <StateBadge campaign={c} />
            {c.isDemo && <DemoTag className="text-faint" />}
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">{c.title}</h1>
          <p className="mt-3 text-muted">
            Organised by <strong className="text-ink">{c.organizer}</strong> · started {formatDate(c.createdAt || c.endDate)}
          </p>

          <div className="story mt-8 max-w-2xl text-[1.05rem] leading-relaxed text-ink/90">
            {c.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">Recent supporters</h2>
            {recentDonations.length ? (
              <ul className="mt-4 divide-y divide-line rounded-3xl border border-line bg-card" data-testid="recent-donations">
                {recentDonations.map((d) => (
                  <li key={d._id} className="flex items-start gap-4 px-5 py-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 font-semibold text-ink-3">
                      {d.donorName.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="font-semibold text-ink">{d.donorName}</span>
                        <span className="tabular font-semibold text-ink">{formatMoney(d.amount)}</span>
                      </div>
                      {d.message && <p className="mt-0.5 text-sm text-muted">"{d.message}"</p>}
                      <div className="mt-0.5 text-xs text-faint">
                        {timeAgo(d.createdAt)}
                        {d.source !== "seed" && ` · ${d.source === "stripe" ? "Stripe test" : "test payment"}`}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-muted">No donations yet. Be the first.</p>
            )}
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-[0_24px_60px_-40px_rgba(16,37,37,0.5)]" data-testid="progress-panel">
            <div className="tabular font-display text-5xl font-semibold leading-none text-ink" data-testid="raised-amount">
              {formatMoney(c.EventCurrentAmount)}
            </div>
            <div className="mt-2 text-muted">raised of {formatMoney(c.EventTargetAmount)} goal</div>
            <div className="mt-5">
              <ProgressBar percent={pct} size="lg" />
            </div>
            <dl className="tabular mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-paper px-2 py-3">
                <dt className="text-xs text-muted">Funded</dt>
                <dd className="mt-1 text-lg font-semibold">{pct}%</dd>
              </div>
              <div className="rounded-2xl bg-paper px-2 py-3">
                <dt className="text-xs text-muted">Donations</dt>
                <dd className="mt-1 text-lg font-semibold" data-testid="donation-count">{c.donationCount ?? 0}</dd>
              </div>
              <div className="rounded-2xl bg-paper px-2 py-3">
                <dt className="text-xs text-muted">Time</dt>
                <dd className="mt-1 text-sm font-semibold leading-7">{daysLeftLabel(c.endDate)}</dd>
              </div>
            </dl>
            <Button
              type="primary"
              size="large"
              shape="round"
              block
              icon={<HeartFilled />}
              className="mt-6 !h-14 !text-base"
              disabled={!canDonate}
              onClick={() => setOpen(true)}
              data-testid="donate-button"
            >
              {canDonate ? "Donate" : "Not accepting donations"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted">
              {remaining > 0 ? `${formatMoney(remaining)} to go. ` : "Goal reached, still accepting gifts. "}
              Test payments only.
            </p>
          </div>
        </aside>
      </div>

      <DonationModal open={open} campaign={c} onClose={() => setOpen(false)} onDonated={reload} />
    </Container>
  );
}
