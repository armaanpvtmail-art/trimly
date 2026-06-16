import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/session";

/** Authenticated users shouldn't see auth screens — bounce them to the app. */
export default async function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  return <>{children}</>;
}
