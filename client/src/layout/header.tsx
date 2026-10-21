import { useState } from "react";
import { Avatar, Button, Drawer, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  BarChartOutlined,
  DashboardOutlined,
  FundOutlined,
  HeartOutlined,
  LogoutOutlined,
  MenuOutlined,
  ProfileOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link, NavLink, useNavigate } from "react-router-dom";
import userStore from "../store/users-store";
import { endSession } from "../lib/session";
import { Brand } from "../components/ui";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors ${
    isActive ? "bg-ink text-paper" : "text-ink hover:bg-paper-2"
  }`;

export default function Header() {
  const navigate = useNavigate();
  const { currentUser } = userStore();
  const [open, setOpen] = useState(false);

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

  const links = (
    <>
      <NavLink to="/campaigns" end className={navClass} onClick={() => setOpen(false)}>
        Campaigns
      </NavLink>
      <a href="/#how-it-works" className="rounded-full px-3.5 py-2 text-sm font-medium text-ink no-underline hover:bg-paper-2" onClick={() => setOpen(false)}>
        How it works
      </a>
      {currentUser && (
        <NavLink to="/dashboard" className={navClass} onClick={() => setOpen(false)}>
          Dashboard
        </NavLink>
      )}
      {currentUser?.isAdmin && (
        <NavLink to="/admin" className={navClass} onClick={() => setOpen(false)}>
          Admin
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/campaigns/new" className="hidden sm:block">
            <Button type="primary" shape="round">
              Start a campaign
            </Button>
          </Link>
          {currentUser ? (
            <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
              <button
                className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 text-sm font-medium text-ink"
                aria-label="Account menu"
              >
                <Avatar size={28} style={{ background: currentUser.isAdmin ? "#f0a43a" : "#1a3636", color: currentUser.isAdmin ? "#102525" : "#f7f4ee" }}>
                  {currentUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <span className="hidden max-w-[9rem] truncate lg:inline">{currentUser.name}</span>
              </button>
            </Dropdown>
          ) : (
            <Link to="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-ink no-underline hover:bg-paper-2">
              Sign in
            </Link>
          )}
          <Button className="md:hidden" shape="circle" icon={<MenuOutlined />} aria-label="Open menu" onClick={() => setOpen(true)} />
        </div>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} placement="right" width={280} title={<Brand />}>
        <nav className="flex flex-col gap-1" aria-label="Mobile">
          {links}
          <Link to="/campaigns/new" onClick={() => setOpen(false)} className="mt-4">
            <Button type="primary" block shape="round">
              Start a campaign
            </Button>
          </Link>
        </nav>
      </Drawer>
    </header>
  );
}
