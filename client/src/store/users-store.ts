import { create } from "zustand"

interface User {
  _id: string
  name: string
  email: string
  isAdmin: boolean
  isActive: boolean
}

interface UserStore {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  clearUser: () => void
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const userStore = create<UserStore>((set) => ({
  currentUser: loadStoredUser(),
  setCurrentUser: (user) => set({ currentUser: user }),
  clearUser: () => set({ currentUser: null }),
}))

export default userStore
