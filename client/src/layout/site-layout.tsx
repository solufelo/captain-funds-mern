import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import Header from "./header";
import DemoBanner from "../components/DemoBanner";
import { Brand } from "../components/ui";
import { REPO_URL } from "../lib/config";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Skip to content
      </a>
      <DemoBanner />
      <Header />
      {/* At least a screen tall, so the footer never flashes into view (and then
          jumps away) while a lazy route or its data is still loading. */}
      <main id="main" key={pathname} className="page-enter min-h-[100svh] flex-1">
        {children}
      </main>
      <footer className="mt-24 overflow-hidden bg-ink text-paper/75">
        <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <Brand light />
              <p className="mt-5 max-w-sm text-sm leading-relaxed">
                A full-stack fundraising platform: public campaign pages, test-mode donations, an organiser dashboard and
                an admin review queue with analytics.
              </p>
            </div>
            <div className="text-sm">
              <div className="kicker text-sky">Explore</div>
              <ul className="mt-4 list-none space-y-2.5 p-0">
                <li><Link className="link-u text-paper/80 no-underline hover:text-paper" to="/campaigns">Browse campaigns</Link></li>
                <li><Link className="link-u text-paper/80 no-underline hover:text-paper" to="/campaigns/new">Start a campaign</Link></li>
                <li><Link className="link-u text-paper/80 no-underline hover:text-paper" to="/login">Demo sign-in</Link></li>
              </ul>
            </div>
            <div className="text-sm">
              <div className="kicker text-sky">About</div>
              <p className="mt-4 leading-relaxed">
                Built by Solomon Olufelo. Every campaign, organiser and donor here is invented for demonstration, and no
                real money moves.
              </p>
              <a className="link-u mt-3 inline-block text-amber no-underline" href={REPO_URL} target="_blank" rel="noreferrer">
                Source on GitHub ↗
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-14 max-w-6xl px-4 sm:px-6" aria-hidden>
          <div className="select-none whitespace-nowrap font-display text-[clamp(3.4rem,13.2vw,11.5rem)] font-semibold leading-[0.78] tracking-[-0.05em] text-paper/[0.07]">
            Captain Funds
          </div>
        </div>
      </footer>
    </div>
  );
}
