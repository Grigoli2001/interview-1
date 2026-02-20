import { headers } from "next/headers";
import { auth, AUTH_ROUTES } from "@/lib/auth";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    const headersList = await headers();
    const callbackUrl = getSafeCallbackUrl(headersList.get("x-callback-url"));
    const signInUrl = new URL(AUTH_ROUTES.signIn, "http://localhost");
    signInUrl.searchParams.set("callbackUrl", callbackUrl);
    redirect(signInUrl.pathname + signInUrl.search);
  }
  return <AppSidebar>{children}</AppSidebar>;
}
