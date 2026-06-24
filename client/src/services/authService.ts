import axios from 'axios'
import { isDemoMode } from '../lib/config'
import { demoLogin, demoRegister } from '../lib/demoStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export async function loginUser(email: string, password: string) {
  if (isDemoMode()) {
    return demoLogin(email, password)
  }
  const response = await axios.post(`${API_BASE_URL}/users/login`, { email, password })
  return response.data
}

export async function registerUser(name: string, email: string, password: string) {
  if (isDemoMode()) {
    return demoRegister(name, email, password)
  }
  const response = await axios.post(`${API_BASE_URL}/users/register`, { name, email, password })
  return response.data
}
