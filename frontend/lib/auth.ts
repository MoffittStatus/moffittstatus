import axios from "axios";
import { BACKEND_URL } from "./apiEndPoints";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  isAdmin: boolean;
}

// Session lives in an httpOnly cookie set by the backend, so every call must send credentials
const authApi = axios.create({ baseURL: BACKEND_URL + "/api/auth", withCredentials: true });

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await authApi.get<{ user: AuthUser | null }>("/me");
    return res.data.user;
  } catch (e) {
    console.error("Failed to load current user", e);
    return null;
  }
}

// Full-page redirect into the Google OAuth flow; returnTo must be a path on this site
export function googleLoginUrl(returnTo: string = "/"): string {
  return `${BACKEND_URL}/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function logout(): Promise<void> {
  await authApi.post("/logout");
}
