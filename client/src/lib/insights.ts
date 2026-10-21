// Pure helpers behind the motion and data storytelling: count-up easing, the
// hero orbit layout, gift impact and period-over-period deltas. No runtime
// imports, so `node --test` can run the unit tests without a bundler.

/** Expo ease-out: fast start, long soft landing. t in [0, 1]. */
export function easeOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}

/** Value of a count-up tween at elapsed ms; whole numbers, ends exactly on `to`. */
export function tweenValue(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  const v = from + (to - from) * easeOutExpo(Math.max(0, elapsed) / duration);
  return Math.round(v);
}

export interface GiftImpact {
  beforePct: number;
  afterPct: number;
  /** Width of the "your gift" segment in percentage points of the goal (capped at 100%). */
  gainPct: number;
  remainingAfter: number;
  reachesGoal: boolean;
}

/** What a gift of `amount` does to a campaign's progress. */
export function giftImpact(raised: number, target: number, amount: number): GiftImpact {
  const gift = Math.max(0, Number.isFinite(amount) ? amount : 0);
  if (!target || target <= 0) {
    return { beforePct: 0, afterPct: 0, gainPct: 0, remainingAfter: 0, reachesGoal: false };
  }
  const pct = (n: number) => (n / target) * 100;
  const before = Math.min(100, pct(raised));
  const after = Math.min(100, pct(raised + gift));
  return {
    beforePct: Math.round(before),
    afterPct: Math.round(pct(raised + gift)),
    gainPct: Math.max(0, after - before),
    remainingAfter: Math.max(0, target - raised - gift),
    reachesGoal: raised < target && raised + gift >= target,
  };
}

export interface PeriodDelta {
  current: number;
  previous: number;
  /** Fractional change vs the previous period, or null when there is nothing to compare with. */
  change: number | null;
}

/** Sum of the last `days` points vs the `days` before them (series is oldest first). */
export function periodDelta(series: { amount: number }[], days = 7): PeriodDelta {
  const sum = (xs: { amount: number }[]) => xs.reduce((s, p) => s + (p.amount || 0), 0);
  const current = sum(series.slice(-days));
  const previous = sum(series.slice(-2 * days, -days));
  return { current, previous, change: previous > 0 ? (current - previous) / previous : null };
}

/** "+12%", "−8%", "flat"; null in, null out. */
export function formatChange(change: number | null): string | null {
  if (change === null || !Number.isFinite(change)) return null;
  const pct = Math.round(change * 100);
  if (pct === 0) return "flat";
  return `${pct > 0 ? "+" : "−"}${Math.abs(pct)}%`;
}

/** Stable small integer for a string (avatar tones, cover seeds). */
export function toneIndex(key: string, buckets: number): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (h >>> 0) % Math.max(1, buckets);
}

export interface OrbitInput {
  id: string;
  target: number;
  raised: number;
}

export interface OrbitBody {
  id: string;
  /** 0-based ring, inner first. */
  ring: number;
  /** Ring radius as a fraction of the stage half-width. */
  radius: number;
  /** Starting angle in radians. */
  angle: number;
  /** Angular speed in radians per second (inner rings move faster). */
  speed: number;
  /** Planet diameter in px at scale 1. */
  size: number;
  percent: number;
}

export const RING_RADII = [0.52, 0.76, 0.98];
const RINGS = RING_RADII;

/**
 * Lays campaigns out on three rings around the ledger "sun": bigger goals get
 * bigger planets, bodies on a ring are spaced evenly with a per-ring offset so
 * no two rings line up, and inner rings orbit faster (a nod to Kepler).
 */
export function orbitLayout(items: OrbitInput[], maxSize = 64, minSize = 30): OrbitBody[] {
  if (!items.length) return [];
  const goals = items.map((c) => Math.sqrt(Math.max(1, c.target)));
  const lo = Math.min(...goals);
  const hi = Math.max(...goals);
  const perRing = Math.ceil(items.length / RINGS.length);
  return items.map((c, i) => {
    const ring = Math.min(RINGS.length - 1, Math.floor(i / perRing));
    const slot = i % perRing;
    const onRing = Math.min(perRing, items.length - ring * perRing);
    const span = hi - lo || 1;
    return {
      id: c.id,
      ring,
      radius: RINGS[ring],
      angle: (slot / onRing) * Math.PI * 2 + ring * 1.1 + 0.35,
      speed: 0.16 / (ring + 1.2),
      size: Math.round(minSize + ((goals[i] - lo) / span) * (maxSize - minSize)),
      percent: c.target > 0 ? Math.round((c.raised / c.target) * 100) : 0,
    };
  });
}

/**
 * Screen position of a body on a tilted circular orbit. `tilt` squashes the
 * vertical axis (0.36 reads as about 70 degrees of tilt). depth runs from -1
 * (behind the sun) to 1 (in front) and drives scale and stacking.
 */
export function orbitPoint(angle: number, radius: number, tilt = 0.36) {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * tilt;
  const depth = Math.sin(angle);
  return { x, y, depth, scale: 0.8 + 0.2 * ((depth + 1) / 2) };
}

/** SVG path for a sparkline through `values`, scaled into a w x h box (0 at the bottom). */
export function sparkPath(values: number[], w: number, h: number, pad = 2): { line: string; area: string } {
  if (!values.length) return { line: "", area: "" };
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => [pad + i * step, h - pad - (Math.max(0, v) / max) * (h - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1][0].toFixed(1);
  return { line, area: `${line} L${last} ${h} L${pad} ${h} Z` };
}

/**
 * Where a gift "comet" is at progress t (0..1) on its fall from a planet at
 * `from` into the ledger sun at the origin: a quadratic curve bent sideways by
 * `bend` (a fraction of the distance), eased in so it speeds up as it falls.
 * `angle` is the heading in degrees, for pointing the tail.
 */
export function cometPoint(from: { x: number; y: number }, t: number, bend = 0.28) {
  const p = Math.min(1, Math.max(0, t));
  const e = p * p;
  const dist = Math.hypot(from.x, from.y) || 1;
  // Control point: halfway in, pushed off the straight line.
  const cx = from.x / 2 - (from.y / dist) * bend * dist;
  const cy = from.y / 2 + (from.x / dist) * bend * dist;
  const u = 1 - e;
  const x = u * u * from.x + 2 * u * e * cx;
  const y = u * u * from.y + 2 * u * e * cy;
  const dx = 2 * u * (cx - from.x) - 2 * e * cx;
  const dy = 2 * u * (cy - from.y) - 2 * e * cy;
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

/** Share of a whole as a label: "37%", "<1%" for a sliver, "0%" for nothing. */
export function shareLabel(part: number, whole: number): string {
  if (!whole || whole <= 0 || part <= 0) return "0%";
  const pct = (part / whole) * 100;
  if (pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

/** Change in the average gift, last `days` vs the `days` before; null without gifts in both. */
export function averageGiftDelta(series: { amount: number; count: number }[], days = 7): number | null {
  const money = periodDelta(series, days);
  const gifts = periodDelta(series.map((p) => ({ amount: p.count })), days);
  if (!gifts.current || !gifts.previous || !money.previous) return null;
  const now = money.current / gifts.current;
  const before = money.previous / gifts.previous;
  return (now - before) / before;
}
