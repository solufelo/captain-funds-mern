import { useAppConfig } from "../lib/hooks";

/** Thin, always-visible honesty strip: this is a demo with fictional data. */
export default function DemoBanner() {
  const config = useAppConfig();
  const payments =
    config.payments === "stripe" ? "Payments run in Stripe test mode" : "Payments are simulated, no money moves";
  return (
    <div className="bg-ink text-paper/85" data-testid="demo-banner">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:text-[0.8rem]">
        <span className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-amber sm:inline-block" />
        <span>
          <strong className="font-semibold text-paper">Portfolio demo.</strong> Campaigns and donors are fictional. {payments}
          {config.browserDemo ? "; data stays in this browser." : "."}
        </span>
      </div>
    </div>
  );
}
