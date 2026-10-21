// The header's antd-powered menus, split out so the first bundle (the landing
// page) doesn't carry antd. header.tsx lazy-loads these.
import type { CSSProperties } from "react";
import { Drawer, Dropdown } from "antd";
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
import { Link, useNavigate } from "react-router-dom";
import ThemeProvider from "../providers/theme-provider";
import api from "../lib/api";
import { useAsync } from "../lib/hooks";
import { formatMoney, formatNumber, timeAgo } from "../lib/format";
import { endSession } from "../lib/session";
import type { User } from "../interfaces";
import { Brand } from "../components/ui";
import { AccountButton } from "./header";

export function AccountMenu({ user, dark }: { user: User; dark: boolean }) {
  const navigate = useNavigate();
  const items: MenuProps["items"] = [
    { key: "dash", label: "Organiser dashboard", icon: <DashboardOutlined />, onClick: () => navigate("/dashboard") },
    { key: "donations", label: "My donations", icon: <HeartOutlined />, onClick: () => navigate("/donations") },
    { key: "profile", label: "Profile", icon: <ProfileOutlined />, onClick: () => navigate("/profile") },
    ...(user.isAdmin
      ? [
          { type: "divider" as const },
          { key: "analytics", label: "Admin analytics", icon: <BarChartOutlined />, onClick: () => navigate("/admin") },
          { key: "manage", label: "Manage campaigns", icon: <FundOutlined />, onClick: () => navigate("/admin/campaigns") },
          { key: "users", label: "Users", icon: <TeamOutlined />, onClick: () => navigate("/users") },
        ]
      : []),
    { type: "divider" as const },
    {
      key: "logout",
      label: "Sign out",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => {
        endSession();
        navigate("/");
      },
    },
  ];
  return (
    <ThemeProvider app={false}>
      <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
        <AccountButton user={user} dark={dark} />
      </Dropdown>
    </ThemeProvider>
  );
}

/** Fills the phone menu: the ledger total and the latest gift, live. */
function MenuLedger() {
  const { data } = useAsync(() => api.stats(), []);
  const latest = data?.recentGifts?.[0];
  return (
    <div className="cf-menu-item mt-auto rounded-[1.4rem] border border-paper/10 bg-paper/[0.04] p-5" style={{ "--i": 5 } as CSSProperties}>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4fbf8a]" />
        </span>
        <span className="kicker text-paper/60">Live ledger</span>
      </div>
      <div className="tabular mt-3 font-display text-[2.4rem] font-semibold leading-none tracking-[-0.03em] text-paper">
        {data ? formatMoney(data.totalRaised) : "…"}
      </div>
      <div className="mt-1.5 text-sm text-paper/55">
        {data ? `${formatNumber(data.totalDonations)} gifts across ${data.liveCampaigns} live campaigns` : "Reading the ledger"}
      </div>
      {latest && (
        <p className="mt-4 border-t border-paper/10 pt-4 text-sm leading-snug text-paper/70">
          <strong className="font-semibold text-paper">{latest.donorName}</strong> gave{" "}
          <strong className="tabular font-semibold text-amber">{formatMoney(latest.amount)}</strong> to {latest.campaignTitle}
          <span className="whitespace-nowrap text-paper/45"> · {timeAgo(latest.createdAt)}</span>
        </p>
      )}
    </div>
  );
}

export function MobileMenu({
  open,
  onClose,
  links,
}: {
  open: boolean;
  onClose: () => void;
  links: { to: string; label: string }[];
}) {
  return (
    <ThemeProvider app={false}>
      <Drawer
        open={open}
        onClose={onClose}
        placement="right"
        width="min(100vw, 26rem)"
        title={<Brand light compact />}
        rootClassName="cf-menu"
        destroyOnHidden
        closeIcon={<span className="text-2xl leading-none text-paper">×</span>}
      >
        <nav className="flex h-full flex-col" aria-label="Mobile">
          <ul className="m-0 mb-8 list-none p-0">
            {links.map((l, i) => (
              <li key={l.to} className="cf-menu-item border-b border-paper/10" style={{ "--i": i } as CSSProperties}>
                <Link
                  to={l.to}
                  onClick={onClose}
                  className="flex items-center justify-between py-4 font-display text-[2rem] font-semibold tracking-[-0.02em] text-paper no-underline"
                >
                  {l.label}
                  <span className="font-sans text-base text-amber">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <MenuLedger />
          <Link to="/campaigns/new" onClick={onClose} className="btn btn-amber mt-4 h-14 w-full text-base">
            Start a campaign
          </Link>
          <p className="mt-4 text-center text-xs text-paper/45">Portfolio demo · fictional campaigns · no real money</p>
        </nav>
      </Drawer>
    </ThemeProvider>
  );
}
