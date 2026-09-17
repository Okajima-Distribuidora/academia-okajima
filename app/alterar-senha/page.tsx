import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ForcePasswordChangeForm } from "@/components/auth/force-password-change-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toast";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Definir senha" };

export default async function ChangePasswordPage() {
  const user = await requireUser();
  if (!user.mustChangePassword) redirect("/");

  return (
    <Toaster>
      <AppHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Defina sua nova senha</CardTitle>
            <p className="text-sm text-muted-foreground">
              Por segurança, substitua a senha temporária antes de continuar.
            </p>
          </CardHeader>
          <CardContent>
            <ForcePasswordChangeForm />
          </CardContent>
        </Card>
      </main>
    </Toaster>
  );
}
