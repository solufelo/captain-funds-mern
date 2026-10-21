import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Campaign } from "../interfaces";
import { campaignState, STATE_LABEL, type CampaignState } from "../lib/format";
import { formatChange } from "../lib/insights";
import helmet from "../assets/helmet-96.png";

export function ProgressBar({
  percent,
  size = "md",
  tone = "amber",
  track = "light",
  gain = 0,
  delay = 0,
}: {
  percent: number;
  size?: "sm" | "md" | "lg";
  tone?: "amber" | "sky" | "ink";
  track?: "light" | "dark";
  /** Extra segment (percentage points) drawn after the fill, e.g. a gift being previewed. */
  gain?: number;
  delay?: number;
}) {
  const h = { sm: "h-1.5", md: "h-2", lg: "h-3" }[size];
  const width = Math.min(100, Math.max(0, percent));
  const extra = Math.max(0, Math.min(100 - width, gain));
  const fill = {
    amber: "bg-gradient-to-r from-amber to-amber-2",
    sky: "bg-gradient-to-r from-sky to-ink-3",
    ink: "bg-ink",
  }[tone];
  return (
    <div
      className={`${h} relative w-full overflow-hidden rounded-full ${track === "dark" ? "bg-paper/15" : "bg-paper-2"}`}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="grow-x absolute inset-y-0 left-0 flex transition-[width] duration-500 ease-[var(--ease-out-expo)]" style={{ width: `${width + extra}%`, "--d": `${delay}ms` } as CSSProperties}>
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-expo)] ${fill}`}
          style={{ width: `${width + extra ? (width / (width + extra)) * 100 : 0}%` }}
        />
        {extra > 0 && (
          <div
            className="gain-stripes -ml-1 h-full rounded-r-full transition-[width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ width: `calc(${(extra / (width + extra)) * 100}% + 0.25rem)` }}
            data-testid="gift-preview-segment"
          />
        )}
      </div>
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
      {state === "live" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss opacity-60 motion-reduce:hidden" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-moss" />
        </span>
      )}
      {STATE_LABEL[state]}
    </span>
  );
}

export function DemoTag({ className = "" }: { className?: string }) {
  return (
    <span
      title="Invented for this portfolio demo. Not a real organisation or appeal."
      className={`inline-flex items-center rounded-full border border-dashed border-current px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wider ${className}`}
    >
      Fictional demo
    </span>
  );
}

export function Brand({ to = "/", light = false, compact = false }: { to?: string; light?: boolean; compact?: boolean }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5 no-underline" aria-label="Captain Funds home">
      <img
        src={helmet}
        alt=""
        width={32}
        height={32}
        className={`${compact ? "h-7 w-7" : "h-8 w-8"} transition-transform duration-700 ease-[var(--ease-spring)] group-hover:-rotate-[14deg]`}
      />
      <span className={`font-display ${compact ? "text-[1.18rem]" : "text-[1.32rem]"} font-semibold leading-none tracking-[-0.02em] ${light ? "text-paper" : "text-ink"}`}>
        Captain&nbsp;Funds
      </span>
    </Link>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent = false,
  extra,
  className = "",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.4rem] border p-5 sm:p-6 ${accent ? "border-ink bg-ink text-paper" : "border-line bg-card"} ${className}`}
    >
      <div className={`kicker ${accent ? "text-sky" : "text-muted"}`}>{label}</div>
      <div className="tabular relative mt-3 font-display text-[clamp(1.6rem,1.2rem+1.4vw,2.35rem)] font-semibold leading-none tracking-[-0.03em]">{value}</div>
      {hint && <div className={`relative mt-2.5 text-sm ${accent ? "text-paper/70" : "text-muted"}`}>{hint}</div>}
      {extra}
    </div>
  );
}

export function PageHeader({ kicker, title, children, actions }: { kicker?: ReactNode; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="reveal">
        {kicker && <div className="kicker text-amber-deep">{kicker}</div>}
        <h1 className="mt-3 font-display text-step-4 font-semibold display-tight text-ink">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-step-0 text-muted">{children}</div>}
      </div>
      {actions && (
        <div className="reveal flex flex-wrap gap-2" style={{ "--d": "120ms" } as CSSProperties}>
          {actions}
        </div>
      )}
    </div>
  );
}

/** Small drifting planet used by empty and error states. */
export function LonePlanet({ tone = "amber" }: { tone?: "amber" | "rose" | "sky" }) {
  const c = { amber: ["#fbe5bf", "#f0a43a"], rose: ["#ffd0c8", "#b8483e"], sky: ["#e1eeff", "#3c6fb0"] }[tone];
  return (
    <svg viewBox="0 0 120 80" className="mx-auto h-20 w-32" aria-hidden>
      <g style={{ animation: "float-y 6s ease-in-out infinite" }}>
        <ellipse cx="60" cy="40" rx="44" ry="10" fill="none" stroke="#102525" strokeOpacity=".25" strokeDasharray="2 5" transform="rotate(-12 60 40)" />
        <circle cx="60" cy="40" r="18" fill={c[0]} stroke="#102525" strokeWidth="1.5" />
        <path d="M44 34a18 18 0 0 1 22-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        <circle cx="98" cy="30" r="3.5" fill={c[1]} />
      </g>
      <circle cx="16" cy="18" r="1.4" fill="#102525" opacity=".35" />
      <circle cx="104" cy="66" r="1.2" fill="#102525" opacity=".3" />
      <circle cx="26" cy="62" r="1" fill="#102525" opacity=".3" />
    </svg>
  );
}

export function EmptyState({
  title,
  children,
  action,
  tone = "amber",
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "amber" | "rose" | "sky";
}) {
  return (
    <div className="reveal rounded-[2rem] border border-dashed border-line bg-card/70 px-6 py-14 text-center sm:py-16">
      <LonePlanet tone={tone} />
      <div className="mt-5 font-display text-step-2 font-semibold text-ink">{title}</div>
      {children && <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

/** Shimmer block for designed loading states. */
export function Skel({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Loading layout shared by dashboards: stat row + two panels. */
export function DashboardSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-label={label}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Skel className="col-span-2 h-[8.5rem] !rounded-[1.4rem] sm:col-span-1" />
        <Skel className="h-[8.5rem] !rounded-[1.4rem]" />
        <Skel className="h-[8.5rem] !rounded-[1.4rem]" />
        <Skel className="hidden h-[8.5rem] !rounded-[1.4rem] lg:block" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[1.6rem] border border-line bg-card p-6">
          <Skel className="h-5 w-40" />
          <div className="mt-6 flex h-[260px] items-end gap-2">
            {[38, 52, 30, 64, 46, 70, 42, 58, 80, 50, 66, 90].map((h, i) => (
              <div key={i} className="skeleton flex-1 !rounded-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-[1.6rem] border border-line bg-card p-6">
          <Skel className="h-5 w-32" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="mt-5 flex items-center gap-3">
              <Skel className="h-9 w-9 !rounded-full" />
              <div className="flex-1">
                <Skel className="h-3.5 w-2/3" />
                <Skel className="mt-2 h-3 w-1/2" />
              </div>
              <Skel className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TONES = ["#fbe5bf", "#e1eeff", "#dcefe4", "#f6dcd7", "#ece3f7", "#efe9dd"];

/** Initial in a soft tone picked from the name, so a list of supporters isn't a grey wall. */
export function Avatar({ name, toneIndex, size = 36 }: { name: string; toneIndex: number; size?: number }) {
  const anon = name === "Anonymous";
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-ink-3"
      style={{ width: size, height: size, background: anon ? "#efe9dd" : TONES[toneIndex % TONES.length], fontSize: size * 0.42 }}
      aria-hidden
    >
      {anon ? "·" : name.charAt(0).toUpperCase()}
    </span>
  );
}

export function DeltaChip({ change, dark = false }: { change: number | null; dark?: boolean }) {
  const label = formatChange(change);
  if (!label) return null;
  const up = (change || 0) > 0.005;
  const down = (change || 0) < -0.005;
  return (
    <span
      className={`tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? (dark ? "bg-[#4fbf8a]/15 text-[#7fd9ad]" : "bg-moss/10 text-moss") : down ? "bg-rose/10 text-rose" : "bg-paper-2 text-muted"
      }`}
      title="Last 7 days compared with the 7 days before"
    >
      {up ? "↑" : down ? "↓" : "→"} {label}
    </span>
  );
}

