import { useState } from "react";
import { Button, Divider, Form, Input } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../common/welcome-content";
import api from "../../../lib/api";
import { DEMO_ACCOUNTS } from "../../../lib/config";
import { errorMessage } from "../../../lib/errors";
import { useAppConfig } from "../../../lib/hooks";
import { safeNext, startSession } from "../../../lib/session";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const config = useAppConfig();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string, key: string, fallbackNext?: string) => {
    setLoading(key);
    setError(null);
    try {
      startSession(await api.login(email, password));
      navigate(params.get("next") ? safeNext(params.get("next")) : fallbackNext || "/dashboard", { replace: true });
    } catch (e) {
      setError(errorMessage(e, "Sign-in failed. Please try again."));
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New here? <Link to={`/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}>Create an account</Link>
        </>
      }
    >
      {config.demoAccounts && (
        <>
          <div className="kicker text-amber-deep">Demo accounts · one click</div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {[
              { key: "demo-user", testid: "demo-organiser", who: "Organiser", what: "Your campaigns, gifts and a 30-day chart", acct: DEMO_ACCOUNTS.user, next: "/dashboard", dot: "#1a3636" },
              { key: "demo-admin", testid: "demo-admin", who: "Admin", what: "Review queue, platform analytics and users", acct: DEMO_ACCOUNTS.admin, next: "/admin", dot: "#f0a43a" },
            ].map((d) => (
              <button
                key={d.key}
                type="button"
                disabled={loading !== null}
                onClick={() => signIn(d.acct.email, d.acct.password, d.key, d.next)}
                data-testid={d.testid}
                className="press group flex w-full cursor-pointer items-center gap-4 rounded-[1.2rem] border border-line bg-card px-4 py-3.5 text-left transition-[border-color,box-shadow] duration-300 hover:border-ink/30 hover:shadow-[0_14px_30px_-20px_rgba(16,37,37,0.5)] disabled:cursor-wait"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold" style={{ background: d.dot, color: d.dot === "#f0a43a" ? "#102525" : "#f7f4ee" }}>
                  {loading === d.key ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : d.who.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{d.who}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-muted">{d.what}</span>
                </span>
                <span className="text-ink/50 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 group-hover:text-ink">→</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-faint">Both accounts are fictional and reset with the demo data.</p>
          <Divider plain className="!my-7 !text-xs !text-faint">
            or sign in with email
          </Divider>
        </>
      )}
      <Form<LoginForm> layout="vertical" requiredMark={false} onFinish={(v) => signIn(v.email, v.password, "form")}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Enter your email address." }]}>
          <Input size="large" autoComplete="email" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, message: "Enter your password." }]}>
          <Input.Password size="large" autoComplete="current-password" />
        </Form.Item>
        {error && (
          <div role="alert" className="mb-4 rounded-2xl border border-rose/25 bg-rose/[0.07] px-4 py-3 text-sm text-rose">
            {error}
          </div>
        )}
        <Button type="primary" htmlType="submit" size="large" shape="round" block loading={loading === "form"} className="press !h-12">
          Sign in
        </Button>
      </Form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/campaigns">Just browsing? See campaigns without an account.</Link>
      </p>
    </AuthShell>
  );
}
