import { redirect } from "next/navigation";
import { SessionRefresh } from "@/components/auth/session-refresh";
import { HomeShell } from "@/components/home/home-shell";
import { Toaster } from "@/components/ui/toast";
import { requireUser } from "@/lib/auth/session";
import { listHomeCategoryNavigation } from "@/lib/home/catalog";
import { listStudioCategories } from "@/lib/studio/categories";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, categoryNavigation] = await Promise.all([
    requireUser(),
    listHomeCategoryNavigation(),
  ]);
  if (user.mustChangePassword) redirect("/alterar-senha");
  const studioCategories = user.isStudioAdmin
    ? await listStudioCategories()
    : [];

  return (
    <Toaster>
      <HomeShell
        name={user.name}
        rca={user.codigorca}
        categories={categoryNavigation}
        categoryNavigation={categoryNavigation}
        studioCategories={studioCategories}
        isStudioAdmin={user.isStudioAdmin}
      >
        <SessionRefresh />
        {children}
      </HomeShell>
    </Toaster>
  );
}
