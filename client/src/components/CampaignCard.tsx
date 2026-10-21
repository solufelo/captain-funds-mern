import { Link } from "react-router-dom";
import type { Campaign } from "../interfaces";
import { daysLeftLabel, formatMoney, percentFunded } from "../lib/format";
import CampaignCover from "./CampaignCover";
import { DemoTag, ProgressBar, StateBadge } from "./ui";

export default function CampaignCard({ campaign, showState = false }: { campaign: Campaign; showState?: boolean }) {
  const pct = percentFunded(campaign);
  return (
    <Link
      to={`/campaigns/${campaign._id}`}
      className="lift group flex flex-col overflow-hidden rounded-3xl border border-line bg-card text-ink no-underline"
      data-testid="campaign-card"
    >
      <div className="relative">
        <CampaignCover
          id={campaign._id}
          category={campaign.EventCategory}
          image={campaign.image}
          title={campaign.title}
          className="aspect-[16/10] w-full"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-paper/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">
            {campaign.EventCategory}
          </span>
          {campaign.isFeatured && (
            <span className="rounded-full bg-amber px-2.5 py-1 text-xs font-semibold text-ink">Featured</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="truncate">{campaign.organizer}</span>
          {campaign.isDemo ? <DemoTag className="shrink-0 text-faint" /> : showState && <StateBadge campaign={campaign} />}
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold leading-snug group-hover:underline group-hover:decoration-amber group-hover:decoration-2 group-hover:underline-offset-4">
          {campaign.title}
        </h3>
        <p className="mt-1 text-sm text-muted">{campaign.location}</p>
        <div className="mt-auto pt-5">
          <ProgressBar percent={pct} />
          <div className="tabular mt-3 flex items-baseline justify-between text-sm">
            <span>
              <strong className="text-base text-ink">{formatMoney(campaign.EventCurrentAmount)}</strong>
              <span className="text-muted"> of {formatMoney(campaign.EventTargetAmount)}</span>
            </span>
            <span className="text-muted">{pct}%</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-faint">
            <span>{campaign.donationCount ?? 0} donations</span>
            <span>{daysLeftLabel(campaign.endDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
