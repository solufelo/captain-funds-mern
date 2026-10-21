import { Link } from "react-router-dom";
import helmet from "../assets/helmet-288.webp";
import { Starfield } from "../components/Space";

/** 404: a helmet drifting past a planet-shaped zero. */
export default function NotFound() {
  return (
    <section className="grain relative -mb-24 -mt-[65px] overflow-hidden bg-ink pt-[65px] text-paper" data-hero>
      <div className="absolute inset-x-0 bottom-0 top-24">
        <Starfield count={100} seed={404} />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100svh-8rem)] max-w-6xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
        <div className="relative flex items-center justify-center font-display font-semibold leading-none tracking-[-0.06em] text-paper" aria-hidden>
          <span className="reveal text-[clamp(7rem,26vw,17rem)]">4</span>
          <span className="reveal relative mx-[0.04em] inline-block h-[clamp(5.6rem,21vw,13.6rem)] w-[clamp(5.6rem,21vw,13.6rem)]" style={{ animationDelay: "120ms" }}>
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 34% 30%, #fff1d2 0%, #ffd48a 20%, #f0a43a 58%, #b86d0b 100%)",
                boxShadow: "0 0 80px 10px rgba(240,164,58,0.25)",
              }}
            />
            <span className="absolute left-1/2 top-1/2 h-[28%] w-[170%] -translate-x-1/2 -translate-y-1/2 -rotate-[16deg] rounded-[50%] border-[3px] border-sky/80" />
          </span>
          <span className="reveal text-[clamp(7rem,26vw,17rem)]" style={{ animationDelay: "240ms" }}>
            4
          </span>
          <img
            src={helmet}
            alt=""
            className="drift absolute -right-[19%] -top-[30%] w-[clamp(3.6rem,10vw,6.5rem)] drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]"
          />
        </div>
        <h1 className="reveal mt-10 font-display text-step-3 font-semibold display-tight text-paper" style={{ animationDelay: "320ms" }}>
          This page drifted out of orbit.
        </h1>
        <p className="reveal mx-auto mt-4 max-w-md text-step-0 text-paper/65" style={{ animationDelay: "400ms" }}>
          The link may be old, or the campaign moved. The rest of the platform is right where you left it.
        </p>
        <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "480ms" }}>
          <Link to="/" className="btn btn-amber h-12">
            Back to the home page
          </Link>
          <Link to="/campaigns" className="btn btn-ghost h-12">
            Browse campaigns
          </Link>
        </div>
        <p className="kicker mt-10 text-paper/50">Error 404 · page not found</p>
      </div>
    </section>
  );
}
