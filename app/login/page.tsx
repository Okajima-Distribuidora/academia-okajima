import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Entrar" };
export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <>
      <AppHeader />
      <main
        id="conteudo"
        className="flex flex-1 items-center justify-center px-6 py-16"
      >
        <section
          aria-labelledby="login-title"
          className="flex w-full max-w-md flex-col gap-8"
        >
          <div className="flex flex-col gap-3">
            <h1
              id="login-title"
              className="text-3xl font-semibold tracking-tight"
            >
              Acessar Academia
            </h1>
            <p className="text-sm text-muted-foreground">
              Use seu RCA ou e-mail para continuar.
            </p>
          </div>
          <LoginForm />
        </section>
      </main>
    </>
  );
}
