import { HomeShell } from "@/components/home/home-shell";
import { SessionRefresh } from "@/components/auth/session-refresh";
import { requireUser } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <HomeShell name={user.name} rca={user.codigorca}><SessionRefresh />{children}</HomeShell>;
}
