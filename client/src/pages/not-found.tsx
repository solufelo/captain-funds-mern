import { Button } from "antd";
import { Link } from "react-router-dom";
import helmet from "../assets/helmet-480.png";
import { Starfield } from "../components/Space";

/** 404: a helmet drifting past a planet-shaped zero. */
export default function NotFound() {
  return (
    <section className="grain relative -mb-24 -mt-[65px] overflow-hidden bg-ink pt-[65px] text-paper" data-hero>
      <Starfield count={110} seed={404} />
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
            className="drift absolute -right-[12%] -top-[18%] w-[clamp(4rem,12vw,7.5rem)] drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]"
          />
        </div>
        <h1 className="reveal mt-10 font-display text-step-3 font-semibold display-tight text-paper" style={{ animationDelay: "320ms" }}>
          This page drifted out of orbit.
        </h1>
        <p className="reveal mx-auto mt-4 max-w-md text-step-0 text-paper/65" style={{ animationDelay: "400ms" }}>
          The link may be old, or the campaign moved. The rest of the platform is right where you left it.
        </p>
        <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "480ms" }}>
          <Link to="/" className="press">
            <Button type="primary" size="large" shape="round" className="!h-12 w-full !bg-amber !px-7 !text-ink sm:w-auto">
              Back to the home page
            </Button>
          </Link>
          <Link to="/campaigns" className="press">
            <Button size="large" shape="round" ghost className="!h-12 w-full !border-paper/30 !px-7 !text-paper sm:w-auto">
              Browse campaigns
            </Button>
          </Link>
        </div>
        <p className="kicker mt-10 text-paper/50">Error 404 · page not found</p>
      </div>
    </section>
  );
}
