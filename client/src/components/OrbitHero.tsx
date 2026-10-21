import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { Campaign, PublicDonation } from "../interfaces";
import { formatMoney, percentFunded } from "../lib/format";
import { cometPoint, orbitLayout, orbitPoint, RING_RADII } from "../lib/insights";
import { CountUp } from "../lib/motion";
import { useReducedMotion } from "../lib/useMotion";
import { paletteFor } from "../lib/palette";
import { ProgressBar } from "./ui";

const TILT = 0.44;
const CYCLE_MS = 4800;
const COMET_MS = 1300;

function Planet({ campaign, size, active }: { campaign: Campaign; size: number; active: boolean }) {
  const [deep, mid, light, accent] = paletteFor(campaign.EventCategory);
  const pct = Math.min(100, percentFunded(campaign));
  const box = size + 16;
  const r = size / 2 + 5;
  const c = 2 * Math.PI * r;
  const id = `pl-${campaign._id}`;
  return (
    <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="block overflow-visible" aria-hidden>
      <defs>
        <radialGradient id={id} cx="0.34" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.22" stopColor={light} />
          <stop offset="0.75" stopColor={mid} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
      </defs>
      <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="rgba(247,244,238,0.14)" strokeWidth="2.5" />
      <circle
        cx={box / 2}
        cy={box / 2}
        r={r}
        fill="none"
        stroke={pct >= 100 ? "#a6d1ff" : "#f0a43a"}
        strokeWidth={active ? 3.5 : 2.5}
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform={`rotate(-90 ${box / 2} ${box / 2})`}
        className="transition-[stroke-width] duration-300"
      />
      <circle cx={box / 2} cy={box / 2} r={size / 2} fill={`url(#${id})`} />
      {size > 40 && (
        <ellipse
          cx={box / 2}
          cy={box / 2}
          rx={size * 0.78}
          ry={size * 0.17}
          fill="none"
          stroke={accent}
          strokeWidth="2"
          opacity="0.8"
          transform={`rotate(-18 ${box / 2} ${box / 2})`}
        />
      )}
    </svg>
  );
}

/**
 * The landing page's signature moment: every live campaign is a planet on a
 * tilted orbit around the ledger. Ring = how far it's funded, size = goal.
 * Planets are buttons (hover, focus or tap to inspect); the card below links
 * to the campaign. Positions are written straight to the DOM in one rAF loop,
 * so React doesn't re-render per frame. Recent gifts replay as comets falling
 * from their campaign's planet into the ledger. Reduced motion: a still system.
 */
export default function OrbitHero({ campaigns, totalRaised, gifts = [] }: { campaigns: Campaign[]; totalRaised?: number; gifts?: PublicDonation[] }) {
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [width, setWidth] = useState(560);
  const [height, setHeight] = useState(460);
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);
  const clock = useRef(0);
  const sunRef = useRef<HTMLDivElement>(null);
  const cometRef = useRef<HTMLSpanElement>(null);
  const giftTagRef = useRef<HTMLSpanElement>(null);
  const giftsRef = useRef(gifts);
  giftsRef.current = gifts;

  const items = campaigns.slice(0, 7);
  const scale = Math.min(1, width / 560);
  const bodies = useMemo(
    () =>
      orbitLayout(
        items.map((c) => ({ id: c._id, target: c.EventTargetAmount, raised: c.EventCurrentAmount })),
        Math.round(66 * scale),
        Math.round(30 * scale),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map((c) => c._id).join(), scale],
  );
  const half = (width / 2) * 0.97;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setWidth(Math.round(e.contentRect.width));
      setHeight(Math.round(e.contentRect.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Orbit loop: runs only while the stage is on screen.
  useEffect(() => {
    if (!bodies.length) return;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const place = () => {
      bodies.forEach((b, i) => {
        const el = bodyRefs.current[i];
        if (!el) return;
        const p = orbitPoint(b.angle + b.speed * clock.current, b.radius * half, TILT);
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${p.scale.toFixed(3)})`;
        el.style.zIndex = p.depth > 0 ? "30" : "10";
        el.style.setProperty("--depth", p.depth.toFixed(2));
      });
    };
    place();
    if (reduced) return;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      last = performance.now();
      if (visible) raf = requestAnimationFrame(tick);
    });
    // One gift comet at a time, replaying the latest gifts in order.
    const sunR = Math.round(132 * scale) / 2 - 2;
    let comet: { x: number; y: number; t0: number; amount: number } | null = null;
    let nextComet = performance.now() + 2600;
    let giftIndex = 0;
    const launch = (now: number) => {
      const list = giftsRef.current;
      const gift = list.length ? list[giftIndex++ % list.length] : null;
      const at = gift ? items.findIndex((c) => c._id === gift.campaignId) : -1;
      const b = bodies[at >= 0 ? at : Math.floor(Math.random() * bodies.length)];
      const p = orbitPoint(b.angle + b.speed * clock.current, b.radius * half, TILT);
      comet = { x: p.x, y: p.y, t0: now, amount: gift?.amount ?? 0 };
    };
    const land = (amount: number) => {
      sunRef.current?.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.07)" }, { transform: "scale(1)" }],
        { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" },
      );
      const tag = giftTagRef.current;
      if (tag && amount) {
        tag.textContent = `+${formatMoney(amount)}`;
        tag.animate(
          [
            { opacity: 0, transform: "translate(-50%, 6px)" },
            { opacity: 1, transform: "translate(-50%, -6px)", offset: 0.25 },
            { opacity: 0, transform: "translate(-50%, -26px)" },
          ],
          { duration: 1500, easing: "cubic-bezier(.16,1,.3,1)" },
        );
      }
    };
    const fly = (now: number) => {
      const el = cometRef.current;
      if (!el) return;
      if (!comet && now >= nextComet) launch(now);
      if (!comet) return;
      const t = (now - comet.t0) / COMET_MS;
      const q = cometPoint(comet, t, 0.5);
      // Land on the sun's rim rather than crossing its face.
      if (t >= 1 || Math.hypot(q.x, q.y) < sunR) {
        el.style.opacity = "0";
        land(comet.amount);
        comet = null;
        nextComet = now + 1800 + Math.random() * 1600;
        return;
      }
      el.style.transform = `translate3d(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px, 0) rotate(${q.angle.toFixed(1)}deg)`;
      el.style.opacity = String(Math.min(1, t * 5));
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!hovering.current) clock.current += dt;
      place();
      fly(now);
      if (visible) raf = requestAnimationFrame(tick);
    };
    if (stageRef.current) io.observe(stageRef.current);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodies, half, reduced, scale]);

  // A little depth: the system leans toward a mouse pointer, the stars drift the other way.
  useEffect(() => {
    const stage = stageRef.current;
    const hero = stage?.closest<HTMLElement>("[data-hero]");
    if (reduced || !stage || !hero || !window.matchMedia?.("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        stage.style.transform = `perspective(1400px) rotateX(${(-ny * 7).toFixed(2)}deg) rotateY(${(nx * 9).toFixed(2)}deg)`;
        hero.style.setProperty("--px", nx.toFixed(3));
        hero.style.setProperty("--py", ny.toFixed(3));
      });
    };
    hero.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener("pointermove", onMove);
    };
  }, [reduced]);

  // Gently tour the planets until someone interacts.
  useEffect(() => {
    if (reduced || items.length < 2) return;
    const id = window.setInterval(() => {
      if (hovering.current || Date.now() < pausedUntil.current) return;
      setActive((a) => (a + 1) % items.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduced, items.length]);

  const pick = (i: number) => {
    pausedUntil.current = Date.now() + 12000;
    setActive(i);
  };
  const current = items[active] || items[0];
  const pct = current ? percentFunded(current) : 0;

  return (
    <div className="relative">
      <div
        ref={stageRef}
        className="orbit-stage relative mx-auto aspect-[10/6.4] w-full select-none sm:aspect-[10/8.2]"
        role="group"
        aria-label="Live campaigns in orbit. Each planet is a campaign; its ring shows how much it has raised."
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") hovering.current = true;
        }}
        onPointerLeave={() => (hovering.current = false)}
      >
        {/* Orbit paths */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
          aria-hidden
        >
          <defs>
            <radialGradient id="orbit-fade" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#f7f4ee" stopOpacity="0.28" />
              <stop offset="1" stopColor="#f7f4ee" stopOpacity="0.06" />
            </radialGradient>
          </defs>
          {RING_RADII.map((r, i) => (
            <ellipse
              key={r}
              cx="0"
              cy="0"
              rx={r * half}
              ry={r * half * TILT}
              fill="none"
              stroke="url(#orbit-fade)"
              strokeWidth="1"
              strokeDasharray={i === 1 ? "2 6" : undefined}
              className="orbit-path"
              style={{ "--d": `${200 + i * 140}ms` } as CSSProperties}
            />
          ))}
        </svg>

        {/* The ledger: the sun everything orbits */}
        <span ref={cometRef} className="comet pointer-events-none absolute left-1/2 top-1/2 z-[35] opacity-0" aria-hidden />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <span ref={giftTagRef} className="gift-tag tabular" aria-hidden />
          <div ref={sunRef} className="sun relative flex aspect-square items-center justify-center rounded-full text-center" style={{ width: Math.round(132 * scale) }}>
            <div className="relative">
              <div className="tabular font-display font-semibold leading-none text-ink" style={{ fontSize: Math.round(25 * scale) }}>
                {totalRaised === undefined ? "…" : <CountUp value={totalRaised} format={formatMoney} duration={1800} />}
              </div>
              <div className="mx-auto mt-1 max-w-[7rem] font-semibold uppercase tracking-[0.14em] text-ink/70" style={{ fontSize: Math.max(8, Math.round(9.5 * scale)) }}>
                on the ledger
              </div>
            </div>
          </div>
        </div>

        {/* Planets */}
        {items.map((c, i) => {
          const b = bodies[i];
          if (!b) return null;
          const box = b.size + 16;
          return (
            <button
              key={c._id}
              ref={(el) => {
                bodyRefs.current[i] = el;
              }}
              type="button"
              className={`planet absolute left-1/2 top-1/2 cursor-pointer rounded-full border-0 bg-transparent p-0 ${i === active ? "is-active" : ""}`}
              style={{ width: box, height: box, marginLeft: -box / 2, marginTop: -box / 2, "--i": i } as CSSProperties}
              aria-label={`${c.title}: ${percentFunded(c)}% funded`}
              aria-pressed={i === active}
              onPointerEnter={() => pick(i)}
              onFocus={() => pick(i)}
              onClick={() => pick(i)}
            >
              <span className="planet-in block">
                <Planet campaign={c} size={b.size} active={i === active} />
              </span>
              <span className="planet-tag tabular" aria-hidden>
                {percentFunded(c)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* The inspected campaign */}
      <div className="relative z-40 mx-auto -mt-[4%] w-[min(100%,25rem)] sm:-mt-[12%] sm:ml-[6%] sm:mr-auto" aria-live="polite">
        {current ? (
          <Link
            to={`/campaigns/${current._id}`}
            className="orbit-card group block rounded-[1.6rem] border border-paper/10 bg-card p-5 text-ink no-underline shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)]"
          >
            <div key={current._id} className="orbit-swap">
            <div className="flex items-center justify-between gap-3">
              <span className="kicker flex items-center gap-2 text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: paletteFor(current.EventCategory)[1] }} />
                {current.EventCategory}
              </span>
              <span className="tabular text-xs font-semibold text-muted">
                {active + 1} / {items.length}
              </span>
            </div>
            <div className="mt-2 font-display text-step-2 font-semibold leading-tight">{current.title}</div>
            <div className="mt-4">
              <ProgressBar percent={pct} size="md" />
            </div>
            <div className="tabular mt-3 flex items-center justify-between text-sm">
              <span>
                <strong className="text-ink">{formatMoney(current.EventCurrentAmount)}</strong>{" "}
                <span className="text-muted">of {formatMoney(current.EventTargetAmount)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
                Open
                <span className="inline-block transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1">→</span>
              </span>
            </div>
            </div>
          </Link>
        ) : (
          <div className="h-[11.5rem] rounded-[1.6rem] border border-paper/10 bg-paper/5" />
        )}
      </div>
    </div>
  );
}
