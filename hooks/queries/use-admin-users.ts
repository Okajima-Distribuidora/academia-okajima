"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AdminUserCreated,
  AdminUsersListData,
} from "@/lib/admin/users/contracts";
import type { AdminUserCreateInput } from "@/lib/admin/users/validation";
import { apiRequest } from "@/lib/query/http";
import { queryKeys } from "@/lib/query/keys";

export function useAdminUsers({
  initialData,
  page,
  pageSize,
  search,
}: {
  initialData: AdminUsersListData;
  page: number;
  pageSize: number;
  search: string;
}) {
  return useQuery({
    queryKey: queryKeys.admin.users.page(page, pageSize, search),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page > 1) params.set("pagina", String(page));
      if (pageSize !== 30) params.set("quantidade", String(pageSize));
      if (search) params.set("busca", search);

      const query = params.toString();
      return apiRequest<AdminUsersListData>(
        query ? `/api/admin/users?${query}` : "/api/admin/users",
      );
    },
    initialData,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdminUserCreateInput) => {
      const response = await apiRequest<{ user: AdminUserCreated }>(
        "/api/admin/users",
        {
          body: JSON.stringify(input),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      return response.user;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.users.all,
      });
    },
  });
}
