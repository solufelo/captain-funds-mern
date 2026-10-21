import { Button } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAppConfig, useAsync } from "../../lib/hooks";
import { formatMoney, formatNumber, percentFunded } from "../../lib/format";
import { DEMO_ACCOUNTS } from "../../lib/config";
import { startSession } from "../../lib/session";
import CampaignCard from "../../components/CampaignCard";
import CampaignCover from "../../components/CampaignCover";
import { Container, ProgressBar } from "../../components/ui";
import type { Campaign } from "../../interfaces";

const STEPS = [
  {
    n: "01",
    title: "An organiser starts a campaign",
    body: "Goal, story, deadline, category. It lands in a review queue instead of going straight to the public.",
  },
  {
    n: "02",
    title: "An admin reviews it",
    body: "Approve, reject with a reason, or feature it on the front page. Only approved campaigns are public.",
  },
  {
    n: "03",
    title: "Supporters give",
    body: "Guests or signed-in donors give through Stripe Checkout in test mode, or a clearly labelled mock payment.",
  },
  {
    n: "04",
    title: "Every total updates",
    body: "One donation ledger feeds the campaign page, the organiser dashboard and the admin analytics, live over Socket.IO.",
  },
];

const ROLES = [
  {
    who: "Supporters",
    points: ["Browse and search without an account", "Give as a guest or signed in", "Anonymous giving hides your name", "History of your own gifts"],
  },
  {
    who: "Organisers",
    points: ["Create a campaign in one form", "See review status at a glance", "Raised, gifts and average gift", "30-day giving chart per account"],
  },
  {
    who: "Admins",
    points: ["Review queue with approve or reject", "Feature, edit or retire campaigns", "Platform analytics by day and category", "Activate, deactivate or remove users"],
  },
];

function HeroStack({ campaigns }: { campaigns: Campaign[] }) {
  // Second card from further down the list so the two covers contrast.
  const [a, , b] = campaigns;
  if (!a) return <div className="aspect-[4/5] w-full rounded-[2rem] bg-paper-2" />;
  return (
    <div className="relative mx-auto w-full max-w-md pb-10 lg:pb-0">
      {b && (
        <div className="absolute -right-4 -top-6 z-0 hidden w-[74%] rotate-[6deg] overflow-hidden rounded-3xl border border-line bg-card opacity-95 shadow-xl sm:block">
          <CampaignCover id={b._id} category={b.EventCategory} image={b.image} className="aspect-[16/10]" />
          <div className="p-4">
            <div className="font-display text-lg font-semibold">{b.title}</div>
          </div>
        </div>
      )}
      <Link
        to={`/campaigns/${a._id}`}
        className="relative z-10 mt-10 block w-[88%] -rotate-[2deg] overflow-hidden rounded-3xl border border-line bg-card text-ink no-underline shadow-2xl transition-transform duration-500 hover:rotate-0"
      >
        <CampaignCover id={a._id} category={a.EventCategory} image={a.image} className="aspect-[16/11]" />
        <div className="p-5">
          <div className="kicker text-muted">{a.EventCategory}</div>
          <div className="mt-1 font-display text-2xl font-semibold leading-snug">{a.title}</div>
          <div className="mt-4">
            <ProgressBar percent={percentFunded(a)} size="lg" />
          </div>
          <div className="tabular mt-3 flex justify-between text-sm">
            <span>
              <strong>{formatMoney(a.EventCurrentAmount)}</strong> <span className="text-muted">raised</span>
            </span>
            <span className="text-muted">{percentFunded(a)}% of {formatMoney(a.EventTargetAmount)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const config = useAppConfig();
  const stats = useAsync(() => api.stats(), []);
  const featured = useAsync(() => api.listCampaigns({ sort: "featured", limit: 6 }), []);
  const list = featured.data || [];

  const tryAs = async (who: "user" | "admin") => {
    const acct = DEMO_ACCOUNTS[who];
    startSession(await api.login(acct.email, acct.password));
    navigate(who === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <>
      {/* Hero */}
      <section className="grain overflow-hidden">
        <Container className="grid items-center gap-14 pb-20 pt-14 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="reveal">
            <div className="kicker text-amber-deep">Community fundraising, end to end</div>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              Small causes deserve a proper <em className="font-medium italic text-ink-3">launchpad.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Captain Funds takes a campaign from idea to funded: organisers publish, admins review, supporters give,
              and every dashboard reads from the same ledger.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/campaigns">
                <Button type="primary" size="large" shape="round" icon={<ArrowRightOutlined />} iconPosition="end">
                  Browse campaigns
                </Button>
              </Link>
              <Link to="/campaigns/new">
                <Button size="large" shape="round">
                  Start a campaign
                </Button>
              </Link>
            </div>
            <dl className="tabular mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6 sm:gap-6" data-testid="platform-stats">
              <div>
                <dt className="kicker text-muted">Raised</dt>
                <dd className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{stats.data ? formatMoney(stats.data.totalRaised) : "…"}</dd>
              </div>
              <div>
                <dt className="kicker text-muted">Donations</dt>
                <dd className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{stats.data ? formatNumber(stats.data.totalDonations) : "…"}</dd>
              </div>
              <div>
                <dt className="kicker text-muted">Live now</dt>
                <dd className="mt-1 font-display text-2xl font-semibold sm:text-3xl">{stats.data ? stats.data.liveCampaigns : "…"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-faint">Live totals from the demo database. All figures are fictional test data.</p>
          </div>
          <div className="reveal" style={{ animationDelay: "120ms" }}>
            <HeroStack campaigns={list} />
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-card">
        <Container className="py-20">
          <div className="max-w-2xl">
            <div className="kicker text-amber-deep">How it works</div>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight">One loop. Every screen reads the same ledger.</h2>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="flex flex-col bg-card p-6">
                <span className="font-display text-5xl font-semibold text-amber">{s.n}</span>
                <h3 className="mt-6 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Featured */}
      <section>
        <Container className="py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="kicker text-amber-deep">Featured campaigns</div>
              <h2 className="mt-3 font-display text-4xl font-semibold">Picked by the admin team</h2>
            </div>
            <Link to="/campaigns" className="text-sm font-semibold text-ink underline decoration-amber decoration-2 underline-offset-4">
              See all campaigns
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.slice(0, 3).map((c) => (
              <CampaignCard key={c._id} campaign={c} />
            ))}
          </div>
        </Container>
      </section>

      {/* Roles */}
      <section className="bg-ink text-paper">
        <Container className="py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="kicker text-sky">Three ways in</div>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-paper">Try it from every side.</h2>
              <p className="mt-4 text-paper/70">
                {config.demoAccounts
                  ? "Demo accounts are ready. One click signs you in; nothing you do here touches real money."
                  : "Create an account to start a campaign, or browse and give as a guest."}
              </p>
              {config.demoAccounts && (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Button size="large" shape="round" onClick={() => tryAs("user")}>
                    Try as organiser
                  </Button>
                  <Button size="large" shape="round" ghost onClick={() => tryAs("admin")}>
                    Try as admin
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ROLES.map((r) => (
                <div key={r.who} className="rounded-3xl border border-paper/15 bg-paper/[0.04] p-6">
                  <div className="font-display text-2xl font-semibold text-amber">{r.who}</div>
                  <ul className="mt-4 space-y-2.5 text-sm text-paper/80">
                    {r.points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-2 h-1 w-3 shrink-0 rounded-full bg-sky" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Under the hood */}
      <section>
        <Container className="py-20">
          <div className="grid grid-cols-1 gap-10 rounded-[2rem] border border-line bg-card p-8 md:grid-cols-2 md:p-12">
            <div>
              <div className="kicker text-amber-deep">Under the hood</div>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight">The MERN stack, with the boring parts done properly.</h2>
            </div>
            <ul className="grid grid-cols-1 gap-3 text-sm text-muted sm:grid-cols-2">
              {[
                ["React + TypeScript", "Ant Design, Tailwind, Recharts"],
                ["Express 5 API", "zod validation on every route"],
                ["MongoDB + Mongoose", "ledger-derived totals"],
                ["Stripe Checkout", "test mode only, webhook + verify"],
                ["JWT auth", "roles re-checked on every request"],
                ["Socket.IO", "live totals on campaign pages"],
              ].map(([t, d]) => (
                <li key={t} className="rounded-2xl bg-paper px-4 py-3">
                  <div className="font-semibold text-ink">{t}</div>
                  <div>{d}</div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
