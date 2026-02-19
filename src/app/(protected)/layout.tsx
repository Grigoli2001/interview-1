import { auth, AUTH_ROUTES } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect(AUTH_ROUTES.signIn);
  }
  return <>{children}</>;
}
