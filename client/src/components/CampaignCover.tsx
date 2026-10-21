import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { PALETTES } from "../lib/palette";

// Deterministic cover art for campaigns without a photo: a dusk "planet"
// scene in the category's colours, with the cause itself standing on the
// horizon (a kennel, a robot, a community fridge...). The motif comes from
// the title, falling back to the category; the composition (planet left or
// right, motif opposite) comes from a hash of the id, so each campaign always
// gets the same cover and neighbouring cards don't mirror each other.
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

type Motif = "robot" | "kennel" | "fridge" | "creek" | "van" | "clinic" | "mural" | "rooftops";

const KEYWORDS: [RegExp, Motif][] = [
  [/\b(van|library|libraries|books?|reading)\b/i, "van"],
  [/\b(robots?|robotics|coding|makers?|stem|laptops?)\b/i, "robot"],
  [/\b(kennels?|rescue|dogs?|cats?|animals?|puppies)\b/i, "kennel"],
  [/\b(fridge|pantry|food|meals?|kitchen)\b/i, "fridge"],
  [/\b(creek|river|clean ?up|parks?|trees?|garden|marsh|shore)\b/i, "creek"],
  [/\b(clinic|health|exam|medical|hospital)\b/i, "clinic"],
  [/\b(murals?|arts?|paint|underpass|gallery)\b/i, "mural"],
];

const BY_CATEGORY: Record<string, Motif> = {
  Education: "robot",
  Technology: "robot",
  Healthcare: "clinic",
  Environment: "creek",
  "Arts & Culture": "mural",
  "Animal Welfare": "kennel",
};

function motifFor(title: string, category: string): Motif {
  for (const [re, m] of KEYWORDS) if (re.test(title)) return m;
  return BY_CATEGORY[category] || "rooftops";
}

const WARM = "#ffd98f";

interface Ink {
  deep: string;
  mid: string;
  planet: string;
  accent: string;
}

/** Each motif is drawn with its base centred on (0, 0), growing upward. */
function drawMotif(m: Motif, { deep: D, mid: M, planet: P, accent: A }: Ink): ReactNode {
  switch (m) {
    case "robot":
      return (
        <>
          <path d="M46 0V-48" stroke={D} strokeWidth="2.4" />
          <path d="M46 -48L64 -42.5L46 -37Z" fill={A} />
          <rect x="-27" y="-15" width="54" height="15" rx="7.5" fill={D} />
          {[-16, 0, 16].map((x) => (
            <circle key={x} cx={x} cy="-7.5" r="3.6" fill={M} opacity=".6" />
          ))}
          <path d="M20 -42L31 -53L33 -67" stroke={D} strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-20 -42L-29 -31L-27 -22" stroke={D} strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-20" y="-50" width="40" height="37" rx="6" fill={D} />
          <rect x="-12" y="-43.5" width="24" height="13" rx="3" fill={WARM} opacity=".92" />
          <path d="M-7 -37H-1M3 -37H7" stroke={D} strokeWidth="2" strokeLinecap="round" opacity=".7" />
          <rect x="-4" y="-57" width="8" height="8" fill={D} />
          <rect x="-17" y="-80" width="34" height="25" rx="8" fill={D} />
          <circle cx="-7" cy="-67.5" r="6.5" fill={A} opacity=".3" />
          <circle cx="7" cy="-67.5" r="6.5" fill={A} opacity=".3" />
          <circle cx="-7" cy="-67.5" r="3.2" fill={A} />
          <circle cx="7" cy="-67.5" r="3.2" fill={A} />
          <path d="M0 -80V-91" stroke={D} strokeWidth="2.5" />
          <circle cx="0" cy="-94" r="3.6" fill={A} />
        </>
      );
    case "kennel":
      return (
        <>
          <path d="M-32 0V-32L0 -54L32 -32V0Z" fill={D} />
          <path d="M-39 -28L0 -57.5L39 -28" stroke={D} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {/* Snow on the ridge: it's a winter build. */}
          <path d="M-37 -32.5L0 -60.5L37 -32.5" stroke="#f7f4ee" strokeWidth="3.4" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity=".92" />
          <rect x="-10" y="-38" width="20" height="5.5" rx="1.5" fill={M} opacity=".75" />
          <path d="M-12 0V-17A12 12 0 0 1 12 -17V0Z" fill={WARM} />
          <g transform="translate(54 0)">
            <ellipse cx="5" cy="-10" rx="11" ry="10" fill={D} />
            <path d="M-11 0V-21C-11 -27 -5 -31 0 -29L5 -13L2 0Z" fill={D} />
            <circle cx="-6" cy="-31" r="7" fill={D} />
            <ellipse cx="-13.5" cy="-29" rx="5.5" ry="3.6" fill={D} />
            <ellipse cx="-1.5" cy="-30" rx="3" ry="6.5" fill={D} transform="rotate(18 -1.5 -30)" />
            <path d="M15 -6C22 -8 25 -16 22 -22" stroke={D} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          </g>
        </>
      );
    case "fridge":
      return (
        <>
          <rect x="-36" y="-58" width="4" height="58" fill={D} />
          <rect x="32" y="-66" width="4" height="66" fill={D} />
          <path d="M-44 -54L44 -66L44 -72L-44 -60Z" fill={D} />
          {/* Solar panel on the shelter roof. */}
          <path d="M-30 -65.5L26 -73L23 -83L-33 -75.5Z" fill={M} />
          <path d="M-11.3 -68L-14.3 -78M7.3 -70.5L4.3 -80.5M-31.5 -70.5L24.5 -78" stroke={P} strokeWidth=".9" opacity=".75" />
          <rect x="-17" y="-50" width="34" height="50" rx="4" fill={D} />
          <rect x="-13" y="-46" width="26" height="30" rx="2" fill={WARM} />
          <path d="M-13 -36H13M-13 -26H13" stroke={D} strokeWidth="1.4" opacity=".55" />
          <circle cx="-8" cy="-39.5" r="2.8" fill={A} />
          <circle cx="-2" cy="-40" r="3.2" fill={M} />
          <rect x="4" y="-44" width="5" height="8" rx="1.2" fill={P} />
          <rect x="-10" y="-33" width="7" height="7" rx="1.2" fill={M} />
          <circle cx="3" cy="-29" r="3" fill={A} />
          <rect x="7" y="-32" width="4" height="6" rx="1" fill={D} opacity=".6" />
          <rect x="9.5" y="-45" width="2" height="9" rx="1" fill={D} />
          <rect x="-13" y="-12" width="26" height="8" rx="1.5" fill={M} opacity=".55" />
          <rect x="22" y="-14" width="18" height="14" rx="1.5" fill={D} />
          <circle cx="27" cy="-16" r="3" fill={A} />
          <circle cx="34" cy="-16.5" r="3.4" fill={P} />
        </>
      );
    case "creek": {
      // Footbridge over the water: deck and rail are quadratic curves; posts join them.
      const at = (x: number, end: number, ctl: number) => {
        const t = (x + 62) / 124;
        return end * (1 - t) ** 2 + 2 * (1 - t) * t * ctl + end * t * t;
      };
      return (
        <>
          <path d="M-84 6Q0 -12 84 6Q0 -1 -84 6Z" fill={P} opacity=".38" />
          <path d="M-30 1.5h14M8 -0.5h10M34 2h8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
          {[-48, -32, -16, 0, 16, 32, 48].map((x) => (
            <path key={x} d={`M${x} ${at(x, -4, -40).toFixed(1)}V${at(x, -16, -54).toFixed(1)}`} stroke={D} strokeWidth="1.8" />
          ))}
          <path d="M-62 -4Q0 -40 62 -4" stroke={D} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M-62 -16Q0 -54 62 -16" stroke={D} strokeWidth="2.2" fill="none" strokeLinecap="round" />
          {[
            [-84, -34, -2],
            [-78, -42, 3],
            [-71, -30, -4],
            [70, -36, 4],
            [77, -28, -3],
          ].map(([x, h, lean]) => (
            <g key={x}>
              <path d={`M${x} 2Q${x + lean / 2} ${h / 2} ${x + lean} ${h}`} stroke={D} strokeWidth="1.6" fill="none" />
              <ellipse cx={x + lean} cy={h + 4} rx="2.4" ry="6" fill={D} transform={`rotate(${lean * 3} ${x + lean} ${h + 4})`} />
            </g>
          ))}
          <path d="M96 0V-20" stroke={D} strokeWidth="2.6" />
          <circle cx="96" cy="-30" r="12" fill={D} />
          <circle cx="88" cy="-24" r="8" fill={D} />
          <circle cx="92" cy="-34" r="4" fill={M} opacity=".55" />
        </>
      );
    }
    case "van": {
      const colours = [A, M, P, WARM, D];
      let x = -43;
      const books: ReactNode[] = [];
      for (const [shelf, base] of [[0, -37.5], [1, -24.5]] as const) {
        x = -43;
        let i = shelf * 3;
        while (x < 6) {
          const w = 3 + (i % 3);
          const h = 7 + ((i * 7) % 5);
          books.push(<rect key={`${shelf}-${i}`} x={x} y={base - h} width={w} height={h} rx=".6" fill={colours[i % colours.length]} opacity={i % 5 === 4 ? 0.55 : 1} />);
          x += w + 1;
          i++;
        }
      }
      return (
        <>
          <path d="M56 -22L92 -34L92 -8Z" fill={WARM} opacity=".16" />
          <path d="M-52 -12L-74 0" stroke={D} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M-54 -10V-50Q-54 -56 -48 -56H24Q32 -56 36 -48L46 -30Q54 -28 54 -20V-10Z" fill={D} />
          <rect x="-46" y="-49" width="56" height="26" rx="2.5" fill={WARM} />
          <path d="M-46 -37H10" stroke={D} strokeWidth="1.4" opacity=".6" />
          {books}
          <path d="M18 -49H28Q31 -49 33 -46L40 -33H18Z" fill={P} opacity=".6" />
          <circle cx="52" cy="-22" r="2.2" fill={WARM} />
          {[-32, 34].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="-9" r="9" fill={D} />
              <circle cx={cx} cy="-9" r="3.4" fill={M} />
            </g>
          ))}
        </>
      );
    }
    case "clinic":
      return (
        <>
          <rect x="-46" y="-56" width="92" height="56" fill={D} />
          <rect x="-50" y="-61" width="100" height="6" rx="1.5" fill={D} />
          {[-38, -22, 10, 26].flatMap((wx, i) =>
            [-48, -27].map((wy, j) => (
              <rect key={`${wx}${wy}`} x={wx} y={wy} width="12" height="10" rx="1" fill={WARM} opacity={(i + j) % 3 === 2 ? 0.45 : 0.92} />
            )),
          )}
          <rect x="-8" y="-22" width="16" height="22" rx="1.5" fill={M} opacity=".85" />
          <path d="M0 -22V0" stroke={D} strokeWidth="1.2" opacity=".6" />
          <rect x="-1.5" y="-66" width="3" height="6" fill={D} />
          <circle cx="0" cy="-77" r="19" fill="#fff6ea" opacity=".18" />
          <circle cx="0" cy="-77" r="12" fill="#fff6ea" />
          <path d="M-2.6 -84H2.6V-79.6H7V-74.4H2.6V-70H-2.6V-74.4H-7V-79.6H-2.6Z" fill={M} />
        </>
      );
    case "mural":
      return (
        <>
          {/* The mural shows through the underpass arch cut into the embankment. */}
          <rect x="-36" y="-54" width="72" height="54" fill={WARM} />
          <circle cx="-12" cy="-30" r="10" fill={A} />
          <path d="M-36 -14Q-18 -26 0 -14T36 -14V0H-36Z" fill={M} />
          <path d="M-36 -6Q-18 -16 0 -6T36 -6V0H-36Z" fill={P} opacity=".85" />
          <path d="M8 -42l4 8 4 -8 4 8" stroke={M} strokeWidth="2" fill="none" strokeLinejoin="round" />
          <path fillRule="evenodd" d="M-80 0V-58H80V0ZM-34 0V-22A34 30 0 0 1 34 -22V0Z" fill={D} />
          <path d="M-80 -63H80M-70 -63V-58M-40 -63V-58M-10 -63V-58M20 -63V-58M50 -63V-58" stroke={D} strokeWidth="2" />
          <path d="M96 -58L82 0H110Z" fill={WARM} opacity=".16" />
          <path d="M96 0V-62M89 -62H103" stroke={D} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="96" cy="-59" r="2.8" fill={WARM} />
        </>
      );
    default: {
      const houses = [
        [-66, 30, 30],
        [-30, 36, 44],
        [12, 28, 34],
        [46, 32, 26],
      ];
      return (
        <>
          {houses.map(([x, w, h], i) => (
            <g key={x}>
              <path d={`M${x} 0V${-h}L${x + w / 2} ${-h - 14}L${x + w} ${-h}V0Z`} fill={D} />
              <rect x={x + 6} y={-h + 8} width="6" height="7" rx=".8" fill={WARM} opacity={i % 2 ? 0.9 : 0.5} />
              <rect x={x + w - 12} y={-h + 8} width="6" height="7" rx=".8" fill={WARM} opacity={i % 2 ? 0.5 : 0.9} />
            </g>
          ))}
          <path d="M92 0V-18" stroke={D} strokeWidth="2.6" />
          <circle cx="92" cy="-28" r="12" fill={D} />
        </>
      );
    }
  }
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
    // Planet on one side, the cause on the other.
    const left = (hash(id) & 1) === 1;
    const px = left ? 78 + r() * 46 : 276 + r() * 46;
    const py = 56 + r() * 42;
    const pr = 40 + r() * 26;
    const tilt = -30 + r() * 24;
    const mx = left ? 278 + r() * 22 : 104 + r() * 22;
    const gy = 212 + r() * 6;
    const stars = Array.from({ length: 22 }, () => ({
      x: r() * 400,
      y: r() * 170,
      s: 0.6 + r() * 1.6,
      o: 0.25 + r() * 0.6,
    }));
    const moonAngle = r() * Math.PI * 2;
    const a = r() * 30;
    const b = r() * 30;
    const far = `M0 196 C 90 ${170 - a}, 170 ${196 + b}, 260 170 S 360 ${196 - a}, 400 183 L400 250 L0 250 Z`;
    const near = `M0 ${gy + 10} C 70 ${gy}, 140 ${gy + 16}, 200 ${gy + 10} S 330 ${gy + 2}, 400 ${gy + 12} L400 250 L0 250 Z`;
    // A flat knoll under the motif so it always stands on the ground.
    const knoll = `M${mx - 112} 250 C${mx - 96} ${gy}, ${mx - 84} ${gy}, ${mx - 64} ${gy} L${mx + 64} ${gy} C${mx + 84} ${gy}, ${mx + 96} ${gy}, ${mx + 112} 250 Z`;
    return { deep, mid, planet, accent, px, py, pr, tilt, mx, gy, stars, moonAngle, far, near, knoll, motif: motifFor(title, category) };
  }, [id, category, title]);

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
  const { deep, mid, planet, accent, px, py, pr, tilt, mx, gy, stars, moonAngle } = scene;
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
      aria-label={title ? `Illustration for ${title}` : `${category} cover art`}
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
          <radialGradient id={`${g}-lamp`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={WARM} stopOpacity="0.32" />
            <stop offset="1" stopColor={WARM} stopOpacity="0" />
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
        <ellipse cx={mx} cy={gy - 20} rx="120" ry="70" fill={`url(#${g}-lamp)`} />
        <g opacity="0.9">
          <path d={scene.near} fill={deep} />
          <path d={scene.knoll} fill={deep} />
        </g>
        <g className="cv-motif" transform={`translate(${mx} ${gy}) scale(1.12)`}>
          {drawMotif(scene.motif, { deep, mid, planet, accent })}
        </g>
      </svg>
    </div>
  );
}
