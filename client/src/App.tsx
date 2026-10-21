import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ThemeProvider from "./providers/theme-provider";
import SiteLayout from "./layout/site-layout";
import PrivateLayout from "./layout/private-layout";
import PublicLayout from "./layout/public-layout";
import AdminLayout from "./layout/admin-layout";
import LandingPage from "./pages/landing";
import Loader from "./components/Loader";
import NotFound from "./pages/not-found";
import { setUnauthorizedHandler } from "./lib/session";

// Only the landing page ships in the first bundle; every other route (and
// the antd components it needs) loads on demand.
const CampaignsPage = lazy(() => import("./pages/campaigns"));
const CampaignDetailPage = lazy(() => import("./pages/campaigns/detail"));
const LoginPage = lazy(() => import("./pages/auth/login"));
const RegisterPage = lazy(() => import("./pages/auth/register"));
const NewCampaignPage = lazy(() => import("./pages/campaigns/new"));
const OrganiserDashboard = lazy(() => import("./pages/dashboard"));
const DonationsPage = lazy(() => import("./pages/donations"));
const ProfilePage = lazy(() => import("./pages/profile"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/analytics"));
const AdminCampaignManagement = lazy(() => import("./pages/admin/campaign-management"));
const UsersPage = lazy(() => import("./pages/users"));

function Loading() {
  return <Loader />;
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

/** Warm the likely next routes once the landing page is idle. */
function usePrefetchRoutes() {
  useEffect(() => {
    const run = () => {
      void import("./pages/campaigns");
      void import("./pages/campaigns/detail");
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(run, 1500);
    return () => clearTimeout(t);
  }, []);
}

export default function App() {
  usePrefetchRoutes();
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SessionWatcher />
        <Routes>
          <Route path="/" element={site(<LandingPage />)} />
          <Route path="/campaigns" element={site(<CampaignsPage />)} />
          <Route path="/campaigns/new" element={signedIn(<NewCampaignPage />)} />
          <Route path="/campaigns/:id" element={site(<CampaignDetailPage />)} />

          <Route path="/login" element={<PublicLayout><Suspense fallback={<Loading />}><LoginPage /></Suspense></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Suspense fallback={<Loading />}><RegisterPage /></Suspense></PublicLayout>} />

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
