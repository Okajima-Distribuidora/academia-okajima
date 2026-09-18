"use client";

import { IconUsersGroup } from "@tabler/icons-react";
import { UsersPageSizeSelect } from "@/components/admin/users/users-page-size-select";
import { UsersSearch } from "@/components/admin/users/users-search";
import { UsersStats } from "@/components/admin/users/users-stats";
import { UsersTable } from "@/components/admin/users/users-table";
import { Card, CardContent } from "@/components/ui/card";
import { DataPagination } from "@/components/ui/data-pagination";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useAdminUsers } from "@/hooks/queries/use-admin-users";
import type { AdminUsersListData } from "@/lib/admin/users/contracts";

export function UsersManager({
  initialData,
}: {
  initialData: AdminUsersListData;
}) {
  const { data } = useAdminUsers({
    initialData,
    page: initialData.users.page,
    pageSize: initialData.users.pageSize,
    search: initialData.users.search,
  });
  const { stats, users } = data;

  return (
    <>
      <UsersStats {...stats} />
      <div className="flex justify-end">
        <UsersSearch search={users.search} />
      </div>
      {users.totalItems > 0 ? (
        <Card className="pt-0">
          <CardContent className="px-0">
            <UsersTable users={users.items} />
          </CardContent>
          <DataPagination
            getPageHref={(page) =>
              getUsersPageHref(page, users.pageSize, users.search)
            }
            page={users.page}
            pageSize={users.pageSize}
            pageSizeControl={
              <UsersPageSizeSelect
                pageSize={users.pageSize}
                search={users.search}
              />
            }
            totalItems={users.totalItems}
          />
        </Card>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconUsersGroup aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>
              {users.search
                ? "Nenhum usuário encontrado."
                : "Nenhum usuário cadastrado."}
            </EmptyTitle>
            <EmptyDescription>
              {users.search
                ? "Tente pesquisar por outro nome de usuário."
                : "Não há usuários disponíveis para listar."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
}

function getUsersPageHref(page: number, pageSize: number, search: string) {
  const params = new URLSearchParams();

  if (page > 1) params.set("pagina", String(page));
  if (pageSize !== 30) params.set("quantidade", String(pageSize));
  if (search) params.set("busca", search);

  const query = params.toString();
  return query ? `/admin/usuarios?${query}` : "/admin/usuarios";
}
