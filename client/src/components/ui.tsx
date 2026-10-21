import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Campaign } from "../interfaces";
import { campaignState, STATE_LABEL, type CampaignState } from "../lib/format";
import helmet from "../assets/helmet-96.png";

export function ProgressBar({ percent, size = "md", tone = "amber" }: { percent: number; size?: "sm" | "md" | "lg"; tone?: "amber" | "sky" }) {
  const h = { sm: "h-1.5", md: "h-2", lg: "h-3" }[size];
  const width = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`${h} w-full overflow-hidden rounded-full bg-paper-2`}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${
          tone === "amber" ? "bg-gradient-to-r from-amber to-amber-deep" : "bg-gradient-to-r from-sky to-ink-3"
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

const STATE_STYLE: Record<CampaignState, string> = {
  live: "bg-moss/10 text-moss ring-moss/25",
  funded: "bg-amber-soft text-amber-deep ring-amber/40",
  pending: "bg-sky-soft text-ink-3 ring-sky",
  rejected: "bg-rose/10 text-rose ring-rose/25",
  ended: "bg-paper-2 text-muted ring-line",
  paused: "bg-paper-2 text-muted ring-line",
};

export function StateBadge({ campaign }: { campaign: Campaign }) {
  const state = campaignState(campaign);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATE_STYLE[state]}`}>
      {state === "live" && <span className="h-1.5 w-1.5 rounded-full bg-moss" />}
      {STATE_LABEL[state]}
    </span>
  );
}

export function DemoTag({ className = "" }: { className?: string }) {
  return (
    <span
      title="Invented for this portfolio demo. Not a real organisation or appeal."
      className={`inline-flex items-center rounded-full border border-dashed border-current px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider ${className}`}
    >
      Fictional demo
    </span>
  );
}

export function Brand({ to = "/", light = false }: { to?: string; light?: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5 no-underline" aria-label="Captain Funds home">
      <img src={helmet} alt="" className="h-8 w-8 transition-transform duration-500 group-hover:-rotate-12" />
      <span className={`font-display text-[1.35rem] font-semibold leading-none ${light ? "text-paper" : "text-ink"}`}>
        Captain&nbsp;Funds
      </span>
    </Link>
  );
}

export function Stat({ label, value, hint, accent = false }: { label: string; value: ReactNode; hint?: ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-ink bg-ink text-paper" : "border-line bg-card"}`}>
      <div className={`kicker ${accent ? "text-sky" : "text-muted"}`}>{label}</div>
      <div className="tabular mt-2 font-display text-3xl font-semibold leading-none">{value}</div>
      {hint && <div className={`mt-2 text-sm ${accent ? "text-paper/70" : "text-muted"}`}>{hint}</div>}
    </div>
  );
}

export function PageHeader({ kicker, title, children, actions }: { kicker?: string; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <div className="kicker text-amber-deep">{kicker}</div>}
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">{title}</h1>
        {children && <div className="mt-3 max-w-2xl text-base text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-card/60 px-6 py-14 text-center">
      <div className="font-display text-2xl font-semibold text-ink">{title}</div>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
