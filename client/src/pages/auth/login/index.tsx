import { Button, Form, Input, message } from "antd"
import WelcomeContent from "../common/welcome-content"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import userStore from "../../../store/users-store"
import { loginUser } from "../../../services/authService"
import { DEMO_ACCOUNTS } from "../../../lib/config"

interface LoginForm {
  email: string
  password: string
}

function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { setCurrentUser } = userStore()

  const onSubmit = async (values: LoginForm) => {
    try {
      setLoading(true)
      const response = await loginUser(values.email, values.password)
      message.success(response.message || "Login successful")
      if (response.token && response.user) {
        localStorage.setItem("token", response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
        document.cookie = `token=${response.token}; path=/; max-age=3600`
        document.cookie = `user=${JSON.stringify(response.user)}; path=/; max-age=3600`
        setCurrentUser(response.user)
      }
      navigate("/")
    } catch (err: any) {
      message.error(err?.response?.data?.message || err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const onFinishFailed = () => {
    message.error("Please fix the highlighted fields")
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
      <div className="welcome-content bg-primary min-h-screen md:flex items-center justify-center hidden">
        <WelcomeContent />
      </div>
      <div className="form-content bg-gray-100 flex items-center justify-center">
        <Form
          className="flex flex-col gap-3 w-96"
          layout="vertical"
          onFinish={onSubmit}
          onFinishFailed={onFinishFailed}
        >
          <h1 className="text-2xl font-bold text-primary">Login to your account</h1>
          <hr className="" />

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please enter your email" }]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Login
          </Button>
          <span className="text-sm text-gray-500">
            Don't have an account? <Link to="/register">Register</Link>
          </span>
          <p className="text-xs text-gray-400">
            Demo: {DEMO_ACCOUNTS.user.email} / {DEMO_ACCOUNTS.user.password} · Admin:{" "}
            {DEMO_ACCOUNTS.admin.email} / {DEMO_ACCOUNTS.admin.password}
          </p>
        </Form>
      </div>
    </div>
  )
}

export default LoginPage