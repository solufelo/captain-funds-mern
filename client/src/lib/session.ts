import type { Session, User } from "../interfaces";
import userStore from "../store/users-store";

const TOKEN_KEY = "token";
const USER_KEY = "user";

function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return safeGet(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  try {
    const raw = safeGet(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function startSession({ token, user }: Session) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage blocked: session lasts for this tab only */
  }
  userStore.getState().setCurrentUser(user);
}

export function updateSessionUser(user: User) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
  userStore.getState().setCurrentUser(user);
}

export function endSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
  // Clear the legacy non-httpOnly cookies older builds wrote.
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "user=; path=/; max-age=0";
  userStore.getState().clearUser();
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn;
}

export function onUnauthorized() {
  endSession();
  unauthorizedHandler?.();
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}
