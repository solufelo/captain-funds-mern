import { Button, Form, message } from "antd"
import WelcomeContent from "../common/welcome-content.tsx"
import Input from "antd/es/input/Input"
import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import { registerUser } from "../../../services/authService"

interface RegisterForm {
  name: string
  email: string
  password: string
}
function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const onSubmit = async (values: RegisterForm) => {
    try {
      setLoading(true)
      const response = await registerUser(values.name, values.email, values.password);
      console.log(response)
      message.success(response.message)
      if (response.message === "User created successfully") {
        navigate("/login");
      }         
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Registration failed")
    } finally {
      setLoading(false)
    } 
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log(errorInfo.errorFields || [])
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
            <div className="welcome-content bg-primary min-h-screen md:flex items-center justify-center hidden">
              <WelcomeContent />
            </div>
            <div className="form-content bg-gray-100 flex items-center justify-center">
              <Form className="flex flex-col gap-3 w-96" layout="vertical" 
              onFinish={onSubmit}
              onFinishFailed={onFinishFailed}>
                <h1 className="text-2xl font-bold text-primary">
                  Register your account</h1>
                <hr className="" />
                <Form.Item 
                name="name" 
                label="Full Name" 
                rules={[{ required: true, message: "Please enter your full name" }]}>
                  <Input placeholder="Enter your full name" />
                </Form.Item>
                <Form.Item 
                name="email" 
                label="Email" 
                rules={[{ required: true, message: "Please enter your email" }]}>
                  <Input placeholder="Enter your email" />
                </Form.Item>
                <Form.Item 
                name="password" 
                label="Password" 
                rules={[{ required: true, message: "Please enter your password" }]}>
                  <Input placeholder="Enter your password" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>Register</Button>
                <span className="text-sm text-gray-500">Already have an account? <Link to="/login">Login</Link></span>
              </Form>
            </div>
    </div>
  )
}

export default RegisterPage