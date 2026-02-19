/** Centralized auth routes - client-safe, no server dependencies */
export const AUTH_ROUTES = {
  signIn: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const;

/** Validates callbackUrl to prevent open redirects. Only allows relative same-origin paths. */
export function getSafeCallbackUrl(raw: string | null | undefined): string {
  const url = raw?.trim() ?? "/";
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/";
}
