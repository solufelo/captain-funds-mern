import { create } from "zustand";
import type { User } from "../interfaces";

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  clearUser: () => void;
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw && localStorage.getItem("token") ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const userStore = create<UserStore>((set) => ({
  currentUser: loadStoredUser(),
  setCurrentUser: (user) => set({ currentUser: user }),
  clearUser: () => set({ currentUser: null }),
}));

export default userStore;
