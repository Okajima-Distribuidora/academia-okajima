import { Suspense } from "react";
import { ForcePasswordChangeDialog } from "@/components/auth/force-password-change-dialog";
import { SessionRefresh } from "@/components/auth/session-refresh";
import { HomeShell } from "@/components/home/home-shell";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { ProtectedShellLoading } from "@/components/home/protected-shell-loading";
import { Toaster } from "@/components/ui/toast";
import { requireUser } from "@/lib/auth/session";
import { listHomeCategoryNavigation } from "@/lib/home/catalog";
import { listStudioCategories } from "@/lib/studio/categories";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedShellLoading />}>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </Suspense>
  );
}

async function ProtectedLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, categoryNavigation] = await Promise.all([
    requireUser(),
    listHomeCategoryNavigation(),
  ]);
  const studioCategories = user.isStudioAdmin
    ? await listStudioCategories()
    : [];

  return (
    <Toaster>
      <SmoothScrollProvider>
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
          {user.mustChangePassword ? <ForcePasswordChangeDialog /> : null}
        </HomeShell>
      </SmoothScrollProvider>
    </Toaster>
  );
}
