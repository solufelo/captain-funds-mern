import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Spin } from "antd";
import ThemeProvider from "./providers/theme-provider";
import SiteLayout from "./layout/site-layout";
import PrivateLayout from "./layout/private-layout";
import PublicLayout from "./layout/public-layout";
import AdminLayout from "./layout/admin-layout";
import LandingPage from "./pages/landing";
import CampaignsPage from "./pages/campaigns";
import CampaignDetailPage from "./pages/campaigns/detail";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import { Container, EmptyState } from "./components/ui";
import { setUnauthorizedHandler } from "./lib/session";

// Signed-in and admin pages are split out so the public pages load fast.
const NewCampaignPage = lazy(() => import("./pages/campaigns/new"));
const OrganiserDashboard = lazy(() => import("./pages/dashboard"));
const DonationsPage = lazy(() => import("./pages/donations"));
const ProfilePage = lazy(() => import("./pages/profile"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/analytics"));
const AdminCampaignManagement = lazy(() => import("./pages/admin/campaign-management"));
const UsersPage = lazy(() => import("./pages/users"));

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

const site = (node: ReactNode) => (
  <SiteLayout>
    <Suspense fallback={<Loading />}>{node}</Suspense>
  </SiteLayout>
);
const signedIn = (node: ReactNode) => site(<PrivateLayout>{node}</PrivateLayout>);
const admin = (node: ReactNode) => signedIn(<AdminLayout>{node}</AdminLayout>);

function SessionWatcher() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setUnauthorizedHandler(() => navigate(`/login?next=${encodeURIComponent(location.pathname)}`, { replace: true }));
  }, [navigate, location.pathname]);
  useEffect(() => window.scrollTo(0, 0), [location.pathname]);
  return null;
}

function NotFound() {
  return (
    <Container className="py-24">
      <EmptyState title="Page not found" action={<a href="/">Back to the home page</a>}>
        The link may be old, or the page moved.
      </EmptyState>
    </Container>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SessionWatcher />
        <Routes>
          <Route path="/" element={site(<LandingPage />)} />
          <Route path="/campaigns" element={site(<CampaignsPage />)} />
          <Route path="/campaigns/new" element={signedIn(<NewCampaignPage />)} />
          <Route path="/campaigns/:id" element={site(<CampaignDetailPage />)} />

          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />

          <Route path="/dashboard" element={signedIn(<OrganiserDashboard />)} />
          <Route path="/donations" element={signedIn(<DonationsPage />)} />
          <Route path="/profile" element={signedIn(<ProfilePage />)} />

          <Route path="/admin" element={admin(<AdminAnalyticsPage />)} />
          <Route path="/admin/campaigns" element={admin(<AdminCampaignManagement />)} />
          <Route path="/users" element={admin(<UsersPage />)} />
          <Route path="/reports" element={<Navigate to="/admin" replace />} />

          <Route path="*" element={site(<NotFound />)} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
