import type { Dayjs } from "dayjs";
import type { CampaignInput } from "../interfaces";

export interface CampaignFormValues {
  title: string;
  organizer: string;
  EventCategory: string;
  location: string;
  EventTargetAmount: number;
  endDate: Dayjs;
  image?: string;
  description: string;
}

export function toCampaignInput(v: CampaignFormValues): CampaignInput {
  return {
    title: v.title.trim(),
    organizer: v.organizer.trim(),
    EventCategory: v.EventCategory,
    location: v.location.trim(),
    EventTargetAmount: v.EventTargetAmount,
    // Noon local time on the chosen day, so the date never shifts across timezones.
    endDate: v.endDate.hour(12).minute(0).second(0).toISOString(),
    image: v.image?.trim() || "",
    description: v.description.trim(),
  };
}
