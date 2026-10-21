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
          <div className="rounded-2xl border border-line bg-card p-4">
            <div className="kicker text-amber-deep">Demo accounts</div>
            <p className="mt-1 text-sm text-muted">One click, no typing. Both are fictional and reset with the demo data.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                size="large"
                loading={loading === "demo-user"}
                onClick={() => signIn(DEMO_ACCOUNTS.user.email, DEMO_ACCOUNTS.user.password, "demo-user", "/dashboard")}
                data-testid="demo-organiser"
              >
                Organiser
              </Button>
              <Button
                size="large"
                loading={loading === "demo-admin"}
                onClick={() => signIn(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password, "demo-admin", "/admin")}
                data-testid="demo-admin"
              >
                Admin
              </Button>
            </div>
          </div>
          <Divider plain className="!text-xs !text-faint">
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
          <div role="alert" className="mb-4 rounded-xl bg-rose/10 px-4 py-3 text-sm text-rose">
            {error}
          </div>
        )}
        <Button type="primary" htmlType="submit" size="large" shape="round" block loading={loading === "form"}>
          Sign in
        </Button>
      </Form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/campaigns">Just browsing? See campaigns without an account.</Link>
      </p>
    </AuthShell>
  );
}
