import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Header from "./header";
import DemoBanner from "../components/DemoBanner";
import { Brand } from "../components/ui";
import { REPO_URL } from "../lib/config";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <DemoBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="mt-24 bg-ink text-paper/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Brand light />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              A full-stack fundraising platform: public campaign pages, test-mode donations, an organiser dashboard and an
              admin review queue with analytics.
            </p>
          </div>
          <div className="text-sm">
            <div className="kicker text-sky">Explore</div>
            <ul className="mt-3 space-y-2">
              <li><Link className="text-paper/80 no-underline hover:text-amber" to="/campaigns">Browse campaigns</Link></li>
              <li><Link className="text-paper/80 no-underline hover:text-amber" to="/campaigns/new">Start a campaign</Link></li>
              <li><Link className="text-paper/80 no-underline hover:text-amber" to="/login">Demo sign-in</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <div className="kicker text-sky">About</div>
            <p className="mt-3 leading-relaxed">
              Built by Solomon Olufelo. Every campaign, organiser and donor here is invented for demonstration.
            </p>
            <a className="mt-2 inline-block text-amber no-underline hover:underline" href={REPO_URL} target="_blank" rel="noreferrer">
              Source on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
