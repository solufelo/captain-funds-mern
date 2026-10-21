import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { PublicDonation } from "../interfaces";
import { formatMoney, timeAgo } from "../lib/format";

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fixed, deterministic star field; a handful of stars twinkle. */
export function Starfield({ count = 90, seed = 7, className = "" }: { count?: number; seed?: number; className?: string }) {
  const stars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => ({
      x: r() * 100,
      y: r() * 100,
      s: 0.4 + r() * r() * 1.6,
      o: 0.2 + r() * 0.6,
      tw: i % 6 === 0,
      d: (r() * 4).toFixed(2),
    }));
  }, [count, seed]);
  return (
    <svg className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.s}
          fill="#f7f4ee"
          opacity={s.o}
          className={s.tw ? "twinkle" : undefined}
          style={s.tw ? ({ "--d": `${s.d}s` } as CSSProperties) : undefined}
        />
      ))}
    </svg>
  );
}

/** Live strip of the latest gifts on the ledger. Pauses on hover/focus. */
export function GiftTicker({ gifts }: { gifts: PublicDonation[] }) {
  if (!gifts.length) return null;
  const row = (hidden: boolean) =>
    gifts.map((g) => (
      <li key={`${g._id}-${hidden}`} className="flex shrink-0 items-center gap-3 pr-10" aria-hidden={hidden || undefined}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
        <span className="whitespace-nowrap text-paper/80">
          <strong className="font-semibold text-paper">{g.donorName}</strong> gave{" "}
          <strong className="tabular font-semibold text-amber">{formatMoney(g.amount)}</strong> to{" "}
          {g.campaignId ? (
            <Link
              to={`/campaigns/${g.campaignId}`}
              tabIndex={hidden ? -1 : undefined}
              className="link-u text-paper no-underline"
            >
              {g.campaignTitle}
            </Link>
          ) : (
            g.campaignTitle
          )}
          <span className="text-paper/45"> · {timeAgo(g.createdAt)}</span>
        </span>
      </li>
    ));
  return (
    <div className="ticker relative flex items-center gap-6 overflow-hidden border-t border-paper/10 py-4 text-sm" data-testid="gift-ticker">
      <div className="z-10 flex shrink-0 items-center gap-2 pl-4 sm:pl-6 lg:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4fbf8a]" />
        </span>
        <span className="kicker whitespace-nowrap text-paper/70">Live ledger</span>
      </div>
      <div
        className="relative min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto"
        style={{ maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)" }}
      >
        <ul
          className="ticker-track m-0 flex w-max list-none p-0 motion-reduce:animate-none"
          style={{ "--ticker-s": `${Math.max(40, gifts.length * 7)}s` } as CSSProperties}
          aria-label="Latest gifts"
        >
          {row(false)}
          {row(true)}
        </ul>
      </div>
    </div>
  );
}
