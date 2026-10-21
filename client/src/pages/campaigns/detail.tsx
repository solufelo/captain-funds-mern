import { useEffect, useState, type CSSProperties } from "react";
import { Alert, Button } from "antd";
import { ArrowLeftOutlined, CheckOutlined, EnvironmentOutlined, HeartFilled, LinkOutlined } from "@ant-design/icons";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import { useAsync, useCampaignLive } from "../../lib/hooks";
import { daysLeftLabel, formatDate, formatMoney, percentFunded, timeAgo } from "../../lib/format";
import { errorMessage } from "../../lib/errors";
import { toneIndex } from "../../lib/insights";
import { CountUp } from "../../lib/motion";
import CampaignCover from "../../components/CampaignCover";
import DonationModal from "../../components/DonationModal";
import { Avatar, Container, DemoTag, EmptyState, ProgressBar, Skel, StateBadge } from "../../components/ui";

const SHOWN = 6;

export default function CampaignDetailPage() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [allSupporters, setAllSupporters] = useState(false);
  const [copied, setCopied] = useState(false);
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
        <EmptyState title="Campaign not found" tone="sky" action={<Link to="/campaigns">Browse campaigns</Link>}>
          It may have been removed, or it is still waiting for admin review.
        </EmptyState>
      </Container>
    );
  }
  if (loading && !data) {
    return (
      <Container className="pt-6 md:pt-10">
        <div role="status" aria-label="Loading campaign">
          <Skel className="h-4 w-28" />
          <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
            <div>
              <Skel className="aspect-[16/9] w-full !rounded-[2rem]" />
              <Skel className="mt-8 h-5 w-48" />
              <Skel className="mt-5 h-12 w-4/5" />
              <Skel className="mt-3 h-12 w-2/3" />
              <Skel className="mt-8 h-4 w-full" />
              <Skel className="mt-3 h-4 w-11/12" />
            </div>
            <Skel className="hidden h-[26rem] !rounded-[2rem] lg:block" />
          </div>
        </div>
      </Container>
    );
  }
  if (!data) return null;

  const { campaign: c, recentDonations, canDonate, viewerIsOwner } = data;
  const pct = percentFunded(c);
  const remaining = Math.max(0, c.EventTargetAmount - c.EventCurrentAmount);
  const supporters = allSupporters ? recentDonations : recentDonations.slice(0, SHOWN);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Container className="pb-32 pt-6 md:pt-10 lg:pb-12">
      <Link to="/campaigns" className="group inline-flex items-center gap-2 text-sm font-medium text-muted no-underline hover:text-ink">
        <ArrowLeftOutlined className="transition-transform duration-300 group-hover:-translate-x-1" /> All campaigns
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

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-12">
        <article className="min-w-0">
          <div className="reveal overflow-hidden rounded-[2rem]">
            <CampaignCover
              id={c._id}
              category={c.EventCategory}
              image={c.image}
              title={c.title}
              alive
              className="aspect-[16/10] w-full sm:aspect-[16/9]"
            />
          </div>
          <div className="reveal mt-8 flex flex-wrap items-center gap-2 text-sm text-muted" style={{ "--d": "80ms" } as CSSProperties}>
            <span className="rounded-full bg-paper-2 px-3 py-1 font-medium text-ink">{c.EventCategory}</span>
            <span className="inline-flex items-center gap-1.5">
              <EnvironmentOutlined /> {c.location}
            </span>
            <StateBadge campaign={c} />
            {c.isDemo && <DemoTag className="text-faint" />}
          </div>
          <h1 className="reveal mt-5 font-display text-step-4 font-semibold display-tight text-ink" style={{ "--d": "140ms" } as CSSProperties}>
            {c.title}
          </h1>
          <p className="reveal mt-4 text-muted" style={{ "--d": "200ms" } as CSSProperties}>
            Organised by <strong className="font-semibold text-ink">{c.organizer}</strong> · started {formatDate(c.createdAt || c.endDate)}
          </p>

          <div className="story reveal mt-10 max-w-[38rem] text-step-1 leading-[1.7] text-ink/90" style={{ "--d": "260ms" } as CSSProperties}>
            {c.description.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <section className="mt-16">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-step-2 font-semibold tracking-[-0.02em]">Recent supporters</h2>
              {recentDonations.length > 0 && <span className="text-sm text-muted">Latest {recentDonations.length}</span>}
            </div>
            {recentDonations.length ? (
              <>
                <ul
                  className="mt-5 list-none divide-y divide-line overflow-hidden rounded-[1.6rem] border border-line bg-card p-0"
                  data-testid="recent-donations"
                >
                  {supporters.map((d, i) => (
                    <li key={d._id} className="supporter flex items-start gap-4 px-5 py-4 sm:px-6" style={{ "--i": i } as CSSProperties}>
                      <Avatar name={d.donorName} toneIndex={toneIndex(d.donorName, 6)} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="font-semibold text-ink">{d.donorName}</span>
                          <span className="tabular font-display text-lg font-semibold text-ink">{formatMoney(d.amount)}</span>
                        </div>
                        {d.message && (
                          <p className="mt-1 font-display text-[1.02rem] italic leading-snug text-ink-3">&ldquo;{d.message}&rdquo;</p>
                        )}
                        <div className="mt-1 text-xs text-faint">
                          {timeAgo(d.createdAt)}
                          {d.source !== "seed" && ` · ${d.source === "stripe" ? "Stripe test" : "test payment"}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {recentDonations.length > SHOWN && (
                  <button
                    type="button"
                    onClick={() => setAllSupporters((v) => !v)}
                    className="press mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-5 text-sm font-semibold text-ink transition-colors hover:border-ink/40"
                    aria-expanded={allSupporters}
                  >
                    {allSupporters ? "Show fewer" : `Show all ${recentDonations.length}`}
                    <span className={`inline-block transition-transform duration-300 ${allSupporters ? "rotate-180" : ""}`}>↓</span>
                  </button>
                )}
              </>
            ) : (
              <div className="mt-5 rounded-[1.6rem] border border-dashed border-line px-6 py-10 text-center">
                <div className="font-display text-xl font-semibold text-ink">No gifts yet.</div>
                <p className="mt-1 text-sm text-muted">The first supporter's name goes right here.</p>
              </div>
            )}
          </section>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="reveal rounded-[2rem] border border-line bg-card p-6 shadow-[0_30px_70px_-45px_rgba(16,37,37,0.55)] sm:p-7"
            style={{ "--d": "160ms" } as CSSProperties}
            data-testid="progress-panel"
          >
            <div className="kicker text-muted">Raised so far</div>
            <div className="tabular mt-2 font-display text-[3.4rem] font-semibold leading-none tracking-[-0.04em] text-ink">
              <CountUp value={c.EventCurrentAmount} format={formatMoney} animateOnMount={false} data-testid="raised-amount" />
            </div>
            <div className="mt-2 text-muted">of a {formatMoney(c.EventTargetAmount)} goal</div>
            <div className="mt-6">
              <ProgressBar percent={pct} size="lg" delay={300} />
            </div>
            <dl className="tabular mt-6 grid grid-cols-3 divide-x divide-line text-center">
              <div className="px-1">
                <dt className="text-xs text-muted">Funded</dt>
                <dd className="mt-1 font-display text-xl font-semibold">{pct}%</dd>
              </div>
              <div className="px-1">
                <dt className="text-xs text-muted">Gifts</dt>
                <dd className="mt-1 font-display text-xl font-semibold" data-testid="donation-count">
                  {c.donationCount ?? 0}
                </dd>
              </div>
              <div className="px-1">
                <dt className="text-xs text-muted">Time</dt>
                <dd className="mt-1.5 text-sm font-semibold leading-6">{daysLeftLabel(c.endDate)}</dd>
              </div>
            </dl>
            <Button
              type="primary"
              size="large"
              shape="round"
              block
              icon={<HeartFilled className="heart" />}
              className="donate-cta press mt-7 !h-14 !text-base"
              disabled={!canDonate}
              onClick={() => setOpen(true)}
              data-testid="donate-button"
            >
              {canDonate ? "Donate" : "Not accepting donations"}
            </Button>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted">
              <span>{remaining > 0 ? `${formatMoney(remaining)} to go · test payments only` : "Goal reached · still accepting gifts"}</span>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 font-semibold text-ink transition-colors hover:bg-paper-2"
                aria-live="polite"
              >
                {copied ? <CheckOutlined className="text-moss" /> : <LinkOutlined />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Phones: the progress panel sits below the story, so keep the CTA in reach. */}
      <div
        data-mobile-cta
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/90 px-4 pt-3 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="tabular truncate text-sm">
              <strong className="font-display text-lg text-ink">{formatMoney(c.EventCurrentAmount)}</strong>
              <span className="text-muted">
                {" "}
                of {formatMoney(c.EventTargetAmount)} · {pct}%
              </span>
            </div>
            <div className="mt-1.5">
              <ProgressBar percent={pct} size="sm" />
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<HeartFilled />}
            className="press !h-12 !px-6"
            disabled={!canDonate}
            onClick={() => setOpen(true)}
            data-testid="donate-button-mobile"
          >
            Donate
          </Button>
        </div>
      </div>

      <DonationModal open={open} campaign={c} onClose={() => setOpen(false)} onDonated={reload} />
    </Container>
  );
}
