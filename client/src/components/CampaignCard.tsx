import { Link } from "react-router-dom";
import type { Campaign } from "../interfaces";
import { daysLeftLabel, formatMoney, percentFunded } from "../lib/format";
import { paletteFor } from "../lib/palette";
import CampaignCover from "./CampaignCover";
import { DemoTag, ProgressBar, StateBadge } from "./ui";

export default function CampaignCard({
  campaign,
  showState = false,
  compact = false,
}: {
  campaign: Campaign;
  showState?: boolean;
  compact?: boolean;
}) {
  const pct = percentFunded(campaign);
  return (
    <Link
      to={`/campaigns/${campaign._id}`}
      className="lift group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-line bg-card text-ink no-underline"
      data-testid="campaign-card"
    >
      <div className="relative overflow-hidden">
        <CampaignCover
          id={campaign._id}
          category={campaign.EventCategory}
          image={campaign.image}
          title={campaign.title}
          className={`${compact ? "aspect-[16/8]" : "aspect-[16/10]"} w-full`}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: paletteFor(campaign.EventCategory)[1] }} />
            {campaign.EventCategory}
          </span>
          {campaign.isFeatured && !compact && (
            <span className="rounded-full bg-amber px-2.5 py-1 text-xs font-semibold text-ink">Featured</span>
          )}
        </div>
        <span
          className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-paper text-ink opacity-0 shadow-lg transition-all duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden
        >
          →
        </span>
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "p-5" : "p-5 sm:p-6"}`}>
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="truncate">{campaign.organizer}</span>
          {campaign.isDemo ? <DemoTag className="shrink-0 text-faint" /> : showState && <StateBadge campaign={campaign} />}
        </div>
        <h3 className={`mt-2 font-display font-semibold leading-[1.15] tracking-[-0.02em] ${compact ? "text-xl" : "text-[1.4rem]"}`}>
          {campaign.title}
        </h3>
        {!compact && <p className="mt-1 text-sm text-muted">{campaign.location}</p>}
        <div className="mt-auto pt-5">
          <ProgressBar percent={pct} />
          <div className="tabular mt-3 flex items-baseline justify-between text-sm">
            <span>
              <strong className="text-base text-ink">{formatMoney(campaign.EventCurrentAmount)}</strong>
              <span className="text-muted"> of {formatMoney(campaign.EventTargetAmount)}</span>
            </span>
            <span className="font-semibold text-ink">{pct}%</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-faint">
            <span>{campaign.donationCount ?? 0} gifts</span>
            <span>{daysLeftLabel(campaign.endDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
