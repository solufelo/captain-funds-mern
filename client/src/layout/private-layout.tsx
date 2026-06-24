import React from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { App } from 'antd'
import Cookies from 'js-cookie'
import Header from './header'
import DemoBanner from '../components/DemoBanner'
import userStore from '../store/users-store'

function PrivateLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { currentUser, setCurrentUser } = userStore()
  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token')
    if (token) {
      const user = JSON.parse(Cookies.get('user') || localStorage.getItem('user') || '{}')
      if (user && Object.keys(user).length > 0) {
        setCurrentUser(user)
        return
      }
    }
    navigate('/login')
    message.error('You are not logged in')
  }, [navigate, message, setCurrentUser])
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }
    return (
    <div>
        <DemoBanner />
        <Header />
        {children}
    </div>
  )
}

export default PrivateLayout