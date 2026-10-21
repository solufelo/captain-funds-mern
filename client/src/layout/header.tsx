import { useEffect, useState, type CSSProperties } from "react";
import { Avatar, Button, Drawer, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  BarChartOutlined,
  DashboardOutlined,
  FundOutlined,
  HeartOutlined,
  LogoutOutlined,
  ProfileOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import userStore from "../store/users-store";
import { endSession } from "../lib/session";
import { Brand } from "../components/ui";

/** Over a dark hero (landing, 404) the header is transparent ink; elsewhere, paper. */
function useOverHero() {
  const { pathname } = useLocation();
  const [over, setOver] = useState(pathname === "/");
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const hero = document.querySelector("[data-hero]");
      setOver(hero ? hero.getBoundingClientRect().bottom > 72 : false);
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
  return over;
}

export default function Header() {
  const navigate = useNavigate();
  const { currentUser } = userStore();
  const [open, setOpen] = useState(false);
  const dark = useOverHero();

  const logout = () => {
    endSession();
    navigate("/");
  };

  const items: MenuProps["items"] = currentUser
    ? [
        { key: "dash", label: "Organiser dashboard", icon: <DashboardOutlined />, onClick: () => navigate("/dashboard") },
        { key: "donations", label: "My donations", icon: <HeartOutlined />, onClick: () => navigate("/donations") },
        { key: "profile", label: "Profile", icon: <ProfileOutlined />, onClick: () => navigate("/profile") },
        ...(currentUser.isAdmin
          ? [
              { type: "divider" as const },
              { key: "analytics", label: "Admin analytics", icon: <BarChartOutlined />, onClick: () => navigate("/admin") },
              { key: "manage", label: "Manage campaigns", icon: <FundOutlined />, onClick: () => navigate("/admin/campaigns") },
              { key: "users", label: "Users", icon: <TeamOutlined />, onClick: () => navigate("/users") },
            ]
          : []),
        { type: "divider" as const },
        { key: "logout", label: "Sign out", icon: <LogoutOutlined />, danger: true, onClick: logout },
      ]
    : [];

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
        dark ? "border-transparent bg-transparent" : "border-line/70 bg-paper/80 backdrop-blur-xl backdrop-saturate-150"
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
              <NavLink key={l.to} to={l.to} end={l.end} className={navClass}>
                {l.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/campaigns/new" className="press hidden sm:block">
            <Button type="primary" shape="round" className={dark ? "!bg-amber !text-ink hover:!bg-[#f5b85c]" : ""}>
              Start a campaign
            </Button>
          </Link>
          {currentUser ? (
            <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
              <button
                className={`flex h-10 cursor-pointer items-center gap-2 rounded-full border py-1 pl-1 pr-1 text-sm font-medium transition-colors lg:pr-3 ${
                  dark ? "border-paper/20 bg-paper/5 text-paper" : "border-line bg-card text-ink hover:border-ink/30"
                }`}
                aria-label="Account menu"
              >
                <Avatar size={30} style={{ background: currentUser.isAdmin ? "#f0a43a" : "#1a3636", color: currentUser.isAdmin ? "#102525" : "#f7f4ee" }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <span className="hidden max-w-[9rem] truncate lg:inline">{currentUser.name}</span>
              </button>
            </Dropdown>
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
            onClick={() => setOpen(true)}
          >
            <span className="h-[1.5px] w-[18px] rounded bg-current" />
            <span className="h-[1.5px] w-[12px] translate-x-[3px] rounded bg-current" />
          </button>
        </div>
      </div>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="right"
        width="min(100vw, 26rem)"
        title={<Brand light compact />}
        rootClassName="cf-menu"
        destroyOnHidden
        closeIcon={<span className="text-2xl leading-none text-paper">×</span>}
      >
        <nav className="flex h-full flex-col" aria-label="Mobile">
          <ul className="m-0 list-none p-0">
            {[{ to: "/", label: "Home" }, ...links, ...(currentUser ? [] : [{ to: "/login", label: "Sign in" }])].map((l, i) => (
              <li key={l.to} className="cf-menu-item border-b border-paper/10" style={{ "--i": i } as CSSProperties}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between py-4 font-display text-[2rem] font-semibold tracking-[-0.02em] text-paper no-underline"
                >
                  {l.label}
                  <span className="font-sans text-base text-amber">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/campaigns/new" onClick={() => setOpen(false)} className="mt-auto pt-8">
            <Button type="primary" block shape="round" size="large" className="!h-14 !bg-amber !text-base !text-ink">
              Start a campaign
            </Button>
          </Link>
          <p className="mt-4 text-center text-xs text-paper/45">Portfolio demo · fictional campaigns · no real money</p>
        </nav>
      </Drawer>
    </header>
  );
}
