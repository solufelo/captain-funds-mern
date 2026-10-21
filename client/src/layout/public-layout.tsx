import { useState, type ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import userStore from "../store/users-store";
import { safeNext } from "../lib/session";

/**
 * For sign-in/register: someone who arrives already signed in goes straight
 * on. Only the state at arrival counts, so the page's own post-login
 * navigation (e.g. demo admin -> /admin) is not overridden.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  const [signedInOnArrival] = useState(() => Boolean(userStore.getState().currentUser));
  const [params] = useSearchParams();
  if (signedInOnArrival) return <Navigate to={safeNext(params.get("next"))} replace />;
  return <>{children}</>;
}
