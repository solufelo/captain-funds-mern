import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import userStore from "../store/users-store";

/** Requires a signed-in user; sends visitors to /login and back afterwards. */
export default function PrivateLayout({ children }: { children: ReactNode }) {
  const { currentUser } = userStore();
  const location = useLocation();
  if (!currentUser) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}
