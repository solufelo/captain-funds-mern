import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import userStore from "../store/users-store";
import { Container, EmptyState } from "../components/ui";

/**
 * UI-side admin gate. The API enforces the same rule on every admin route;
 * this only avoids showing a page that would fail to load.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { currentUser } = userStore();
  if (!currentUser?.isAdmin) {
    return (
      <Container className="py-20">
        <EmptyState title="Admins only" action={<Link to="/dashboard">Go to your dashboard</Link>}>
          This page is for platform admins. Sign in with the demo admin account to see it.
        </EmptyState>
      </Container>
    );
  }
  return <>{children}</>;
}
