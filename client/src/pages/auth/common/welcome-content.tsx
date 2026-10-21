import type { CSSProperties, ReactNode } from "react";
import { Brand } from "../../../components/ui";
import { Starfield } from "../../../components/Space";

/** A still, slowly turning system: the same motif as the landing hero. */
function MiniOrbit() {
  const rings = [
    { r: 92, dur: 38, planet: "#a6d1ff", size: 14, start: 20 },
    { r: 142, dur: 64, planet: "#cfe8b4", size: 20, start: 200 },
    { r: 196, dur: 96, planet: "#ffd0c8", size: 16, start: 110 },
  ];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem]" aria-hidden>
      <div className="absolute inset-0">
        {rings.map((ring) => (
          <div
            key={ring.r}
            className="absolute left-1/2 top-1/2 rounded-full border border-paper/15"
            style={{ width: ring.r * 2, height: ring.r * 2, marginLeft: -ring.r, marginTop: -ring.r }}
          >
            <div className="absolute inset-0" style={{ transform: `rotate(${ring.start}deg)` }}>
            <div className="mini-orbit absolute inset-0" style={{ "--dur": `${ring.dur}s` } as CSSProperties}>
              <span
                className="absolute left-1/2 top-0 rounded-full"
                style={{
                  width: ring.size,
                  height: ring.size,
                  marginLeft: -ring.size / 2,
                  marginTop: -ring.size / 2,
                  background: `radial-gradient(circle at 35% 30%, #fff, ${ring.planet} 45%, #2b4f4f)`,
                }}
              />
            </div>
            </div>
          </div>
        ))}
      </div>
      <div className="sun absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full" />
    </div>
  );
}

/** Split auth layout: night-sky brand panel (desktop), form on paper. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-[1fr_1.1fr]">
      <div className="grain relative hidden flex-col justify-between overflow-hidden bg-ink p-10 text-paper md:flex lg:p-14">
        <Starfield count={70} seed={11} />
        <div className="relative">
          <Brand light />
        </div>
        <div className="relative">
          <MiniOrbit />
          <h2 className="reveal mt-6 max-w-md font-display text-[clamp(2rem,1.2rem+2vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-paper">
            Every gift lands on <em className="font-normal italic text-amber">one ledger.</em>
          </h2>
          <p className="reveal mt-4 max-w-sm text-paper/60" style={{ "--d": "100ms" } as CSSProperties}>
            Sign in to run a campaign, or to review and feature them as an admin.
          </p>
        </div>
        <p className="relative text-xs text-paper/45">Portfolio demo · fictional campaigns · test payments only</p>
      </div>
      <div className="flex items-center justify-center bg-paper px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 md:hidden">
            <Brand />
          </div>
          <h1 className="reveal font-display text-step-4 font-semibold display-tight text-ink">{title}</h1>
          <div className="reveal mt-3 text-muted" style={{ "--d": "60ms" } as CSSProperties}>
            {subtitle}
          </div>
          <div className="reveal mt-9" style={{ "--d": "120ms" } as CSSProperties}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
