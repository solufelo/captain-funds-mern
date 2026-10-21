import { useState } from "react";
import { Button, Form, Input } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../common/welcome-content";
import api from "../../../lib/api";
import { errorMessage } from "../../../lib/errors";
import { safeNext, startSession } from "../../../lib/session";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      startSession(await api.register(values.name, values.email, values.password));
      navigate(safeNext(params.get("next")), { replace: true });
    } catch (e) {
      setError(errorMessage(e, "Couldn't create the account. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have one? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <Form<RegisterForm> layout="vertical" requiredMark={false} onFinish={onSubmit}>
        <Form.Item name="name" label="Full name" rules={[{ required: true, min: 2, max: 80, message: "Enter your name (2+ characters)." }]}>
          <Input size="large" autoComplete="name" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Enter a valid email address." }]}>
          <Input size="large" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          extra="At least 8 characters."
          rules={[{ required: true, min: 8, max: 128, message: "Use at least 8 characters." }]}
        >
          <Input.Password size="large" autoComplete="new-password" />
        </Form.Item>
        {error && (
          <div role="alert" className="mb-4 rounded-xl bg-rose/10 px-4 py-3 text-sm text-rose">
            {error}
          </div>
        )}
        <Button type="primary" htmlType="submit" size="large" shape="round" block loading={loading}>
          Create account
        </Button>
      </Form>
    </AuthShell>
  );
}
