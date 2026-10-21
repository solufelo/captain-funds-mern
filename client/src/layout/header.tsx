import { forwardRef, lazy, Suspense, useEffect, useState, type ButtonHTMLAttributes } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import userStore from "../store/users-store";
import type { User } from "../interfaces";
import { Brand } from "../components/ui";

// antd menus load on demand (prefetched on idle from App.tsx), keeping antd
// out of the landing page's first bundle.
const AccountMenu = lazy(() => import("./header-menus").then((m) => ({ default: m.AccountMenu })));
const MobileMenu = lazy(() => import("./header-menus").then((m) => ({ default: m.MobileMenu })));

/** The avatar pill that opens the account menu (also its loading stand-in). */
export const AccountButton = forwardRef<HTMLButtonElement, { user: User; dark: boolean } & ButtonHTMLAttributes<HTMLButtonElement>>(
  function AccountButton({ user, dark, className = "", ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        {...rest}
        className={`flex h-10 cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-1 text-sm font-medium transition-colors lg:pr-3 ${
          dark ? "border-paper/20 bg-paper/5 text-paper" : "border-line bg-card text-ink hover:border-ink/30"
        } ${className}`}
        aria-label="Account menu"
      >
        <span
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full font-display text-[0.95rem] font-semibold leading-none"
          style={{ background: user.isAdmin ? "#f0a43a" : "#1a3636", color: user.isAdmin ? "#102525" : "#f7f4ee" }}
          aria-hidden
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden max-w-[9rem] truncate lg:inline">{user.name}</span>
      </button>
    );
  },
);

/**
 * Over a dark hero (landing, 404) the header is clear ink, frosting over once
 * the page scrolls under it; elsewhere, paper.
 */
function useOverHero() {
  const { pathname } = useLocation();
  const [over, setOver] = useState(pathname === "/");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const hero = document.querySelector("[data-hero]");
      setOver(hero ? hero.getBoundingClientRect().bottom > 72 : false);
      setScrolled(window.scrollY > 8);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    // The page renders after the header on navigation; look again once it has.
    const late = window.setTimeout(check, 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(late);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);
  return { dark: over, frosted: over && scrolled };
}

export default function Header() {
  const { pathname } = useLocation();
  const { currentUser } = userStore();
  const [open, setOpen] = useState(false);
  const [menuWanted, setMenuWanted] = useState(false);
  const { dark, frosted } = useOverHero();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `relative rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors duration-300 ${
      isActive
        ? dark
          ? "bg-paper text-ink"
          : "bg-ink text-paper"
        : dark
          ? "text-paper/85 hover:bg-paper/10 hover:text-paper"
          : "text-ink hover:bg-paper-2"
    }`;

  const links = [
    { to: "/campaigns", label: "Campaigns", end: true },
    { to: "/#how-it-works", label: "How it works", hash: true },
    ...(currentUser ? [{ to: "/dashboard", label: "Dashboard" }] : []),
    ...(currentUser?.isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
        frosted
          ? "border-paper/10 bg-ink/70 backdrop-blur-xl backdrop-saturate-150"
          : dark
            ? "border-transparent bg-transparent"
            : "border-line/70 bg-paper/80 backdrop-blur-xl backdrop-saturate-150"
      }`}
      data-tone={dark ? "dark" : "light"}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand light={dark} />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) =>
            l.hash ? (
              <a key={l.to} href={l.to} className={navClass({ isActive: false })}>
                {l.label}
              </a>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                // /users lives under the admin area even though its path doesn't.
                className={({ isActive }) => navClass({ isActive: isActive || (l.to === "/admin" && pathname === "/users") })}
              >
                {l.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          {/* Over the hero, the hero's own CTA is in view; this one fades in once it scrolls away. */}
          <Link
            to="/campaigns/new"
            className={`btn btn-sm hidden transition-[opacity,transform,background-color] duration-500 sm:inline-flex ${
              dark ? "btn-amber pointer-events-none -translate-y-1 opacity-0" : "btn-ink"
            }`}
            aria-hidden={dark || undefined}
            tabIndex={dark ? -1 : undefined}
          >
            Start a campaign
          </Link>
          {currentUser ? (
            <Suspense fallback={<AccountButton user={currentUser} dark={dark} />}>
              <AccountMenu user={currentUser} dark={dark} />
            </Suspense>
          ) : (
            <Link
              to="/login"
              className={`rounded-full px-3 py-2 text-sm font-semibold no-underline transition-colors ${
                dark ? "text-paper hover:bg-paper/10" : "text-ink hover:bg-paper-2"
              }`}
            >
              Sign in
            </Link>
          )}
          <button
            className={`flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-full border md:hidden ${
              dark ? "border-paper/25 text-paper" : "border-line bg-card text-ink"
            }`}
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => {
              setMenuWanted(true);
              setOpen(true);
            }}
          >
            <span className="h-[1.5px] w-[18px] rounded bg-current" />
            <span className="h-[1.5px] w-[12px] translate-x-[3px] rounded bg-current" />
          </button>
        </div>
      </div>
      {menuWanted && (
        <Suspense fallback={null}>
          <MobileMenu
            open={open}
            onClose={() => setOpen(false)}
            links={[{ to: "/", label: "Home" }, ...links, ...(currentUser ? [] : [{ to: "/login", label: "Sign in" }])]}
          />
        </Suspense>
      )}
    </header>
  );
}
