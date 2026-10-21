import { useMemo, useState, type CSSProperties } from "react";
import { PALETTES } from "../lib/palette";

// Deterministic cover art for campaigns without a photo: a small "planet"
// scene coloured by category and laid out from a hash of the campaign id, so
// each campaign always gets the same, distinct cover.
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface Props {
  id: string;
  category: string;
  image?: string;
  title?: string;
  className?: string;
  /** Slow float + twinkle, for the one big cover on a page. */
  alive?: boolean;
  style?: CSSProperties;
}

export default function CampaignCover({ id, category, image, title = "", className = "", alive = false, style }: Props) {
  const [broken, setBroken] = useState(false);
  const scene = useMemo(() => {
    const r = rng(hash(id + category));
    const [deep, mid, planet, accent] = PALETTES[category] || PALETTES.Other;
    const px = 120 + r() * 220;
    const py = 70 + r() * 90;
    const pr = 46 + r() * 52;
    const tilt = -30 + r() * 24;
    const stars = Array.from({ length: 22 }, () => ({
      x: r() * 400,
      y: r() * 170,
      s: 0.6 + r() * 1.6,
      o: 0.25 + r() * 0.6,
    }));
    const moonAngle = r() * Math.PI * 2;
    const hill = (base: number, amp: number) => {
      const a = r() * 30;
      const b = r() * 30;
      return `M0 ${base} C 90 ${base - amp - a}, 170 ${base + b}, 260 ${base - amp} S 360 ${base - a}, 400 ${base - amp / 2} L400 250 L0 250 Z`;
    };
    return { deep, mid, planet, accent, px, py, pr, tilt, stars, moonAngle, far: hill(196, 26), near: hill(222, 18) };
  }, [id, category]);

  if (image && !broken) {
    return (
      <div className={`relative overflow-hidden bg-ink ${className}`} style={style}>
        <img
          src={image}
          alt={title}
          loading="lazy"
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  const g = `g-${hash(id).toString(36)}`;
  const { deep, mid, planet, accent, px, py, pr, tilt, stars, moonAngle } = scene;
  const ring = (sweep: 0 | 1, width: number, opacity = 1) => (
    <path
      d={`M ${px - pr * 1.75} ${py} A ${pr * 1.75} ${pr * 0.42} 0 0 ${sweep} ${px + pr * 1.75} ${py}`}
      fill="none"
      stroke={accent}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
      transform={`rotate(${tilt} ${px} ${py})`}
    />
  );
  return (
    <div
      className={`relative overflow-hidden ${alive ? "cv-alive" : ""} ${className}`}
      style={{ background: deep, ...style }}
      role="img"
      aria-label={`${category} cover art`}
    >
      <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`${g}-sky`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={deep} />
            <stop offset="1" stopColor={mid} />
          </linearGradient>
          <radialGradient id={`${g}-planet`} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="0.25" stopColor={planet} />
            <stop offset="1" stopColor={mid} />
          </radialGradient>
          <radialGradient id={`${g}-shade`} cx="0.75" cy="0.8" r="0.7">
            <stop offset="0" stopColor={deep} stopOpacity="0.55" />
            <stop offset="1" stopColor={deep} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${g}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={planet} stopOpacity="0.45" />
            <stop offset="1" stopColor={planet} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="250" fill={`url(#${g}-sky)`} />
        {stars.map((s, i) => (
          <circle
            key={i}
            className="cv-star"
            cx={s.x}
            cy={s.y}
            r={s.s}
            fill="#fff"
            opacity={s.o}
            style={{ "--d": `${(i % 7) * 0.45}s` } as CSSProperties}
          />
        ))}
        <circle cx={px} cy={py} r={pr * 2} fill={`url(#${g}-glow)`} />
        <g className="cv-planet">
          <g className="cv-ring">{ring(1, 3, 0.55)}</g>
          <circle cx={px} cy={py} r={pr} fill={`url(#${g}-planet)`} />
          <circle cx={px} cy={py} r={pr} fill={`url(#${g}-shade)`} />
          <g className="cv-ring">{ring(0, 3.5)}</g>
          <circle
            cx={px + Math.cos(moonAngle) * pr * 1.9}
            cy={py + Math.sin(moonAngle) * pr * 0.9}
            r={pr * 0.13}
            fill={accent}
          />
        </g>
        <path d={scene.far} fill={deep} opacity="0.55" />
        <path d={scene.near} fill={deep} opacity="0.9" />
      </svg>
    </div>
  );
}
