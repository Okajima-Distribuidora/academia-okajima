import { IconArrowLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserCreateForm } from "@/components/admin/users/user-create-form";
import { StudioPageFrame } from "@/components/studio/layout/studio-page-frame";
import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Novo usuário | Painel administrativo",
};

export default function AdminCreateUserPage() {
  return (
    <StudioPageFrame>
      <StudioPageHeader
        title="Criar usuário"
        description="Cadastre os dados iniciais de um novo usuário da Academia."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/usuarios"
          >
            <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
            Voltar para usuários
          </Link>
        }
      />
      <UserCreateForm />
    </StudioPageFrame>
  );
}
