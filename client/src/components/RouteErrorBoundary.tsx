import { Component, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import helmet from "../assets/helmet-288.webp";

type Props = { pathname: string; children: ReactNode };

class Boundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: Props, prevState: { failed: boolean }) {
    // Navigating away clears the crash. Skip the update that first showed it, or the
    // navigation that crashed would retry at once.
    if (this.state.failed && prevState.failed && prev.pathname !== this.props.pathname) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    // Plain markup and global classes only: a shared component may be what broke.
    return (
      <section
        data-testid="crash-fallback"
        className="grain relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-ink px-4 py-20 text-center text-paper sm:px-6"
      >
        <img src={helmet} alt="" className="drift w-[clamp(4.5rem,12vw,7rem)] drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]" />
        <div role="alert">
          <h1 className="reveal mt-10 font-display text-step-3 font-semibold display-tight text-paper">This page lost signal.</h1>
          <p className="reveal mx-auto mt-4 max-w-md text-step-0 text-paper/65" style={{ animationDelay: "80ms" }}>
            Something went wrong on this page. A reload usually brings it back.
          </p>
        </div>
        <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "160ms" }}>
          <button type="button" className="btn btn-amber h-12" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a href="/" className="btn btn-ghost h-12">
            Back to the home page
          </a>
        </div>
        <p className="kicker mt-10 text-paper/50">Error · page crashed</p>
      </section>
    );
  }
}

/** Catches a crash anywhere under the router, so one broken page can't blank the whole site. */
export default function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary pathname={pathname}>{children}</Boundary>;
}
