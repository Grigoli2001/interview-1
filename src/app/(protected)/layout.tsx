import { headers } from "next/headers";
import { auth, AUTH_ROUTES } from "@/lib/auth";
import { getSafeCallbackUrl } from "@/lib/auth-routes";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { ClientOnly } from "@/components/client-only";

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
  return (
    <ClientOnly
      fallback={
        <div className="flex min-h-screen w-full">
          <div className="hidden w-64 shrink-0 border-r md:block" />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      }
    >
      <AppSidebar>{children}</AppSidebar>
    </ClientOnly>
  );
}
