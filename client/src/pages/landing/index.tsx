import type { CSSProperties, ReactNode } from "react";
import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAppConfig, useAsync } from "../../lib/hooks";
import { daysLeftLabel, formatMoney, formatNumber, percentFunded } from "../../lib/format";
import { DEMO_ACCOUNTS } from "../../lib/config";
import { startSession } from "../../lib/session";
import { CountUp, Reveal } from "../../lib/motion";
import CampaignCard from "../../components/CampaignCard";
import CampaignCover from "../../components/CampaignCover";
import OrbitHero from "../../components/OrbitHero";
import { GiftTicker, Starfield } from "../../components/Space";
import { Container, ProgressBar } from "../../components/ui";
import type { Campaign } from "../../interfaces";

function Glyph({ kind }: { kind: "launch" | "review" | "give" | "ledger" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 text-ink" aria-hidden>
      {kind === "launch" && (
        <>
          <circle cx="24" cy="24" r="13" {...common} strokeDasharray="3 4" />
          <path d="M24 18v12M18 24h12" {...common} />
        </>
      )}
      {kind === "review" && (
        <>
          <circle cx="24" cy="24" r="13" {...common} />
          <path d="M18.5 24.5l4 4 7.5-8.5" {...common} stroke="#a05f08" strokeWidth={2} />
          <ellipse cx="24" cy="24" rx="21" ry="6" {...common} opacity=".35" transform="rotate(-18 24 24)" />
        </>
      )}
      {kind === "give" && (
        <>
          <circle cx="24" cy="24" r="17" {...common} opacity=".25" />
          <circle cx="24" cy="24" r="17" {...common} stroke="#f0a43a" strokeWidth={2.4} strokeDasharray="72 107" transform="rotate(-90 24 24)" />
          <circle cx="24" cy="24" r="10" fill="#102525" />
        </>
      )}
      {kind === "ledger" && (
        <>
          <circle cx="24" cy="24" r="7" fill="#f0a43a" />
          <ellipse cx="24" cy="24" rx="20" ry="8" {...common} opacity=".5" />
          <circle cx="44" cy="24" r="2.6" fill="#102525" />
          <circle cx="9" cy="28.5" r="2" fill="#102525" />
        </>
      )}
    </svg>
  );
}

const STEPS = [
  {
    glyph: "launch" as const,
    title: "Launch",
    body: "An organiser sets a goal, a story and a deadline. It goes to review, not straight to the public.",
  },
  {
    glyph: "review" as const,
    title: "Review",
    body: "An admin approves, rejects with a reason, or features it on the front page.",
  },
  {
    glyph: "give" as const,
    title: "Give",
    body: "Supporters give as guests or signed in, through Stripe test mode or a labelled mock payment.",
  },
  {
    glyph: "ledger" as const,
    title: "Count",
    body: "One ledger feeds the campaign page, the organiser dashboard and admin analytics, live.",
  },
];

const STACK = [
  ["React + TypeScript", "Ant Design, Tailwind, Recharts"],
  ["Express 5", "zod on every route"],
  ["MongoDB", "totals derived from the ledger"],
  ["Stripe Checkout", "test mode, webhook + verify"],
  ["JWT", "roles re-read on every request"],
  ["Socket.IO", "live totals on campaign pages"],
];

function SectionHead({ kicker, title, children, align = "left" }: { kicker: string; title: ReactNode; children?: ReactNode; align?: "left" | "split" }) {
  return (
    <Reveal className={align === "split" ? "grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end" : "max-w-3xl"}>
      <div>
        <div className="kicker text-amber-deep">{kicker}</div>
        <h2 className="mt-4 font-display text-step-4 font-semibold display-tight text-ink">{title}</h2>
      </div>
      {children && <div className={`text-step-1 text-muted ${align === "split" ? "md:pb-2" : "mt-5"}`}>{children}</div>}
    </Reveal>
  );
}

function FeatureLead({ c }: { c: Campaign }) {
  const pct = percentFunded(c);
  return (
    <Link
      to={`/campaigns/${c._id}`}
      className="lift group relative flex h-full min-h-[26rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-line text-paper no-underline"
      data-testid="campaign-card"
    >
      <div className="absolute inset-0">
        <CampaignCover id={c._id} category={c.EventCategory} image={c.image} title={c.title} className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber px-2.5 py-1 text-xs font-semibold text-ink">Featured</span>
          <span className="rounded-full bg-paper/15 px-2.5 py-1 text-xs font-semibold text-paper backdrop-blur">{c.EventCategory}</span>
        </div>
        <h3 className="mt-4 max-w-md font-display text-step-3 font-semibold leading-[1.02] text-paper">{c.title}</h3>
        <p className="mt-2 text-sm text-paper/70">
          {c.organizer} · {c.location}
        </p>
        <div className="mt-6 max-w-md">
          <ProgressBar percent={pct} size="md" track="dark" />
          <div className="tabular mt-3 flex items-baseline justify-between text-sm">
            <span>
              <strong className="text-base text-paper">{formatMoney(c.EventCurrentAmount)}</strong>
              <span className="text-paper/60"> of {formatMoney(c.EventTargetAmount)}</span>
            </span>
            <span className="text-paper/70">
              {pct}% · {daysLeftLabel(c.endDate)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const config = useAppConfig();
  const stats = useAsync(() => api.stats(), []);
  const featured = useAsync(() => api.listCampaigns({ sort: "featured", limit: 7 }), []);
  const list = featured.data || [];
  const s = stats.data;

  const tryAs = async (who: "user" | "admin") => {
    const acct = DEMO_ACCOUNTS[who];
    startSession(await api.login(acct.email, acct.password));
    navigate(who === "admin" ? "/admin" : "/dashboard");
  };

  const lines = ["Small causes", "deserve a proper"];

  return (
    <>
      {/* Hero: the ledger and its campaigns, in orbit */}
      <section className="grain relative -mt-[65px] overflow-hidden bg-ink pt-[65px] text-paper" data-hero>
        <div className="absolute inset-0 [mask-image:linear-gradient(90deg,rgba(0,0,0,0.3),rgba(0,0,0,0.3)_38%,#000_62%)]">
          <Starfield />
        </div>
        <div
          className="pointer-events-none absolute -right-40 top-10 h-[46rem] w-[46rem] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(240,164,58,0.18), rgba(240,164,58,0) 65%)" }}
          aria-hidden
        />
        <Container className="relative grid gap-x-4 gap-y-8 pb-12 pt-10 sm:pt-16 lg:grid-cols-[1.12fr_1fr] lg:grid-rows-[auto_1fr] lg:pb-16 lg:pt-20">
          <div className="relative z-10 lg:self-end">
            <div className="reveal kicker flex items-center gap-3 text-amber" style={{ "--d": "60ms" } as CSSProperties}>
              <span className="h-px w-8 bg-amber/60" />
              Community fundraising, end to end
            </div>
            <h1 className="mt-6 font-display text-[clamp(2.9rem,1.6rem+3.6vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-paper">
              {lines.map((l, i) => (
                <span key={l} className="line-mask">
                  <span style={{ "--d": `${120 + i * 110}ms` } as CSSProperties}>{l}</span>
                </span>
              ))}
              <span className="line-mask">
                <span style={{ "--d": "340ms" } as CSSProperties}>
                  <em className="font-normal italic text-amber">launchpad.</em>
                </span>
              </span>
            </h1>
          </div>
          <div className="relative -mx-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-ml-6 lg:-mr-12 lg:self-center">
            <OrbitHero campaigns={list} totalRaised={s?.totalRaised} />
          </div>
          <div className="relative z-10 lg:col-start-1 lg:row-start-2">
            <p className="reveal lg:mt-1 max-w-[34rem] text-step-1 leading-relaxed text-paper/70" style={{ "--d": "480ms" } as CSSProperties}>
              Every planet here is a live campaign, and its ring fills as gifts land. Organisers launch, admins review,
              supporters give, and one ledger keeps every total honest.
            </p>
            <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row" style={{ "--d": "580ms" } as CSSProperties}>
              <Link to="/campaigns" className="press">
                <Button
                  type="primary"
                  size="large"
                  shape="round"
                  icon={<ArrowRightOutlined />}
                  iconPosition="end"
                  className="!h-[3.25rem] w-full !bg-amber !px-7 !text-ink hover:!bg-[#f5b85c] sm:w-auto"
                >
                  Browse campaigns
                </Button>
              </Link>
              <Link to="/campaigns/new" className="press">
                <Button size="large" shape="round" ghost className="!h-[3.25rem] w-full !border-paper/30 !px-7 !text-paper hover:!border-paper sm:w-auto">
                  Start a campaign
                </Button>
              </Link>
            </div>
            <dl
              className="reveal tabular mt-12 grid max-w-[30rem] grid-cols-3 gap-4 border-t border-paper/15 pt-6"
              style={{ "--d": "700ms" } as CSSProperties}
              data-testid="platform-stats"
            >
              <div>
                <dt className="kicker text-paper/50">Gifts</dt>
                <dd className="mt-1.5 font-display text-step-2 font-semibold text-paper">
                  {s ? <CountUp value={s.totalDonations} format={formatNumber} /> : "…"}
                </dd>
              </div>
              <div>
                <dt className="kicker text-paper/50">Average</dt>
                <dd className="mt-1.5 font-display text-step-2 font-semibold text-paper">
                  {s ? <CountUp value={s.totalDonations ? Math.round(s.totalRaised / s.totalDonations) : 0} format={formatMoney} /> : "…"}
                </dd>
              </div>
              <div>
                <dt className="kicker text-paper/50">Live now</dt>
                <dd className="mt-1.5 font-display text-step-2 font-semibold text-paper">{s ? <CountUp value={s.liveCampaigns} /> : "…"}</dd>
              </div>
            </dl>
            <p className="reveal mt-3 text-xs text-paper/40" style={{ "--d": "760ms" } as CSSProperties}>
              Live from the demo database. Every figure is fictional test data.
            </p>
          </div>
        </Container>
        <GiftTicker gifts={s?.recentGifts || []} />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20">
        <Container className="py-24 sm:py-32">
          <SectionHead kicker="How it works" title={<>One loop. <em className="font-normal italic text-ink-3">One ledger.</em></>} align="split">
            Four steps from idea to funded, and every screen you can open reads from the same record of gifts.
          </SectionHead>
          <ol className="relative mt-16 grid list-none gap-10 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            <Reveal as="div" className="absolute left-0 right-0 top-6 hidden lg:block" aria-hidden>
              <div className="sr-line h-px w-full bg-gradient-to-r from-line via-amber/60 to-line" />
            </Reveal>
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 120} className="relative">
                <div className="relative inline-flex rounded-full bg-paper pr-4">
                  <Glyph kind={step.glyph} />
                </div>
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="tabular font-display text-sm font-semibold text-amber-deep">0{i + 1}</span>
                  <h3 className="font-display text-step-2 font-semibold text-ink">{step.title}</h3>
                </div>
                <p className="mt-3 max-w-[17rem] text-[0.95rem] leading-relaxed text-muted">{step.body}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Featured */}
      <section className="border-y border-line bg-card">
        <Container className="py-24 sm:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead kicker="Featured" title="Picked by the admin team" />
            <Reveal>
              <Link to="/campaigns" className="group inline-flex items-center gap-2 text-sm font-semibold text-ink no-underline">
                <span className="link-u">See all campaigns</span>
                <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
              </Link>
            </Reveal>
          </div>
          {list.length ? (
            <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
              <Reveal className="h-full">
                <FeatureLead c={list[0]} />
              </Reveal>
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-1">
                {list.slice(1, 3).map((c, i) => (
                  <Reveal key={c._id} delay={120 + i * 120} className="w-[82%] shrink-0 snap-start sm:w-auto">
                    <CampaignCard campaign={c} compact />
                  </Reveal>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-14 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
              <div className="skeleton min-h-[26rem] rounded-[2rem]" />
              <div className="grid gap-6">
                <div className="skeleton h-48 rounded-3xl" />
                <div className="skeleton h-48 rounded-3xl" />
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Roles */}
      <section>
        <Container className="py-24 sm:py-32">
          <SectionHead kicker="Three ways in" title={<>Try it from <em className="font-normal italic text-ink-3">every</em> side.</>} align="split">
            {config.demoAccounts
              ? "Demo accounts are ready. One click signs you in, and nothing here touches real money."
              : "Create an account to start a campaign, or browse and give as a guest."}
          </SectionHead>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line md:grid-cols-3">
            {[
              {
                who: "Supporter",
                line: "Give in under a minute.",
                points: ["Browse and search, no account", "Give as a guest or signed in", "Anonymous gifts hide your name", "A history of your own gifts"],
                cta: (
                  <Link to="/campaigns" className="press inline-block">
                    <Button shape="round" size="large">Browse as a guest</Button>
                  </Link>
                ),
              },
              {
                who: "Organiser",
                line: "See every gift land.",
                points: ["Start a campaign in one form", "Review status at a glance", "Raised, gifts and average gift", "A 30-day giving chart"],
                cta: config.demoAccounts ? (
                  <Button shape="round" size="large" type="primary" className="press" onClick={() => tryAs("user")}>
                    Try as organiser
                  </Button>
                ) : null,
              },
              {
                who: "Admin",
                line: "Keep the platform honest.",
                points: ["Approve or reject with a reason", "Feature, edit or retire campaigns", "Analytics by day, category, source", "Activate or remove users"],
                cta: config.demoAccounts ? (
                  <Button shape="round" size="large" className="press" onClick={() => tryAs("admin")}>
                    Try as admin
                  </Button>
                ) : null,
              },
            ].map((r, i) => (
              <Reveal key={r.who} delay={i * 110} className="flex flex-col bg-card p-7 sm:p-9">
                <div className="kicker text-faint">0{i + 1}</div>
                <div className="mt-4 font-display text-step-3 font-semibold text-ink">{r.who}</div>
                <div className="mt-1 font-display text-lg italic text-ink-3">{r.line}</div>
                <ul className="mt-6 flex-1 list-none space-y-3 p-0 text-[0.95rem] text-muted">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-3">
                      <span className="mt-[0.6rem] h-px w-4 shrink-0 bg-amber" />
                      {p}
                    </li>
                  ))}
                </ul>
                {r.cta && <div className="mt-8">{r.cta}</div>}
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Under the hood */}
      <section className="pb-8">
        <Container>
          <Reveal className="grid gap-10 rounded-[2rem] bg-paper-2 p-8 sm:p-12 lg:grid-cols-[1.15fr_1.4fr] lg:gap-14">
            <div>
              <div className="kicker text-amber-deep">Under the hood</div>
              <h2 className="mt-4 font-display text-[clamp(1.7rem,1.3rem+1.3vw,2.4rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
                The MERN stack, with the boring parts done properly.
              </h2>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {STACK.map(([t, d]) => (
                <div key={t} className="border-t border-ink/10 py-4">
                  <dt className="font-semibold text-ink">{t}</dt>
                  <dd className="mt-0.5 text-sm text-muted">{d}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
