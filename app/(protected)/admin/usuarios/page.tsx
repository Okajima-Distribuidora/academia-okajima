import { IconUserPlus } from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { UsersManager } from "@/components/admin/users/users-manager";
import { StudioPageFrame } from "@/components/studio/layout/studio-page-frame";
import { StudioPageHeader } from "@/components/studio/layout/studio-page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  getAdminUsersPage,
  getAdminUsersPageSize,
  getAdminUsersSearch,
  getAdminUsersStats,
  listAdminUsers,
} from "@/lib/admin/users";

export const metadata: Metadata = { title: "Usuários | Painel administrativo" };

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/usuarios">) {
  const params = await searchParams;
  const search = getAdminUsersSearch(params.busca);
  const [users, stats] = await Promise.all([
    listAdminUsers(
      getAdminUsersPage(params.pagina),
      getAdminUsersPageSize(params.quantidade),
      search,
    ),
    getAdminUsersStats(),
  ]);

  return (
    <StudioPageFrame>
      <StudioPageHeader
        title="Usuários"
        description="Gerencie os usuários e suas permissões na Academia Okajima."
        actions={
          <Link className={buttonVariants()} href="/admin/usuarios/novo">
            <IconUserPlus data-icon="inline-start" aria-hidden="true" />
            Criar novo usuário
          </Link>
        }
      />
      <UsersManager initialData={{ stats, users }} />
    </StudioPageFrame>
  );
}
