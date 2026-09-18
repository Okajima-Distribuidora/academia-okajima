"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { ActiveVideoUpload } from "@/components/studio/uploads/video-upload-dialog";
import { apiRequest } from "@/lib/query/http";
import { queryKeys } from "@/lib/query/keys";
import type {
  StudioContentItem,
  StudioContentPage,
  StudioContentType,
  StudioVideoPrivacy,
} from "@/lib/studio/content/contracts";
import { shouldPollStudioContent } from "@/lib/studio/content/upload-view";

export function useStudioContent({
  type,
  page,
  initialData,
  activeUpload,
}: {
  type: StudioContentType;
  page: number;
  initialData: StudioContentPage;
  activeUpload: ActiveVideoUpload | null;
}) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.studio.content.page(type, page);
  const activeUploadId = activeUpload?.databaseVideoId ?? null;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type === "shorts") params.set("tipo", "shorts");
      if (page > 1) params.set("pagina", String(page));

      const next = await apiRequest<StudioContentPage>(
        `/api/studio/content?${params}`,
      );
      const previous = queryClient.getQueryData<StudioContentPage>(queryKey);
      return {
        ...next,
        items: next.items.map((item) => ({
          ...item,
          thumbnailUrl:
            item.thumbnailUrl ??
            previous?.items.find((current) => current.id === item.id)
              ?.thumbnailUrl ??
            null,
        })),
      };
    },
    initialData,
    refetchInterval: (query) =>
      shouldPollStudioContent(query.state.data?.items ?? [], activeUpload)
        ? 5_000
        : false,
  });

  useEffect(() => {
    if (!activeUploadId || page !== 1 || type !== "videos") return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.studio.content.page(type, page),
    });
  }, [activeUploadId, page, queryClient, type]);

  return query;
}

type CancelUploadInput = {
  item: StudioContentItem;
  cancel: (databaseVideoId: number, vimeoVideoId: string) => Promise<void>;
};

type UpdateVisibilityInput = {
  item: StudioContentItem;
  privacy: StudioVideoPrivacy;
};

type DeleteVideoInput = {
  item: StudioContentItem;
};

export function useUpdateStudioVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item, privacy }: UpdateVisibilityInput) =>
      apiRequest<{ privacy: StudioVideoPrivacy; visibilityLabel: string }>(
        `/api/studio/content/${encodeURIComponent(item.publicId)}/visibility`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ privacy }),
        },
      ),
    onMutate: async ({ item, privacy }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.studio.content.all,
      });
      const snapshots = queryClient.getQueriesData<StudioContentPage>({
        queryKey: queryKeys.studio.content.all,
      });
      queryClient.setQueriesData<StudioContentPage>(
        { queryKey: queryKeys.studio.content.all },
        (current) => updateVisibilityItem(current, item.id, privacy),
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.studio.content.all,
      });
    },
  });
}

export function useCancelStudioUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, cancel }: CancelUploadInput) => {
      if (!item.vimeoId) throw new Error("O vídeo não possui ID do Vimeo.");
      await cancel(item.id, item.vimeoId);
    },
    onMutate: async ({ item }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.studio.content.all,
      });
      const snapshots = queryClient.getQueriesData<StudioContentPage>({
        queryKey: queryKeys.studio.content.all,
      });
      queryClient.setQueriesData<StudioContentPage>(
        { queryKey: queryKeys.studio.content.all },
        (current) => updateCancellingItem(current, item.id),
      );
      return { snapshots };
    },
    onSuccess: (_data, { item }) => {
      queryClient.setQueriesData<StudioContentPage>(
        { queryKey: queryKeys.studio.content.all },
        (current) => updateCancelledItem(current, item.id),
      );
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.studio.content.all,
      });
    },
  });
}

export function useDeleteStudioVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ item }: DeleteVideoInput) =>
      apiRequest<void>(
        `/api/studio/content/${encodeURIComponent(item.publicId)}`,
        { method: "DELETE" },
      ),
    onMutate: async ({ item }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.studio.content.all,
      });
      const snapshots = queryClient.getQueriesData<StudioContentPage>({
        queryKey: queryKeys.studio.content.all,
      });
      queryClient.setQueriesData<StudioContentPage>(
        { queryKey: queryKeys.studio.content.all },
        (current) => removeContentItem(current, item.id),
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.studio.content.all,
      });
    },
  });
}

function updateCancellingItem(
  current: StudioContentPage | undefined,
  itemId: number,
) {
  if (!current) return current;
  return {
    ...current,
    items: current.items.map((item) =>
      item.id === itemId
        ? { ...item, uploadActionStatus: "cancelling" as const }
        : item,
    ),
  };
}

function updateVisibilityItem(
  current: StudioContentPage | undefined,
  itemId: number,
  privacy: StudioVideoPrivacy,
) {
  if (!current) return current;
  return {
    ...current,
    items: current.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            privacy,
            visibilityLabel: privacy === 0 ? "Público" : "Privado",
          }
        : item,
    ),
  };
}

function updateCancelledItem(
  current: StudioContentPage | undefined,
  itemId: number,
) {
  if (!current) return current;
  return {
    ...current,
    items: current.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            uploadStatus: "cancelled" as const,
            uploadActionStatus: undefined,
            statusLabel: "Envio cancelado",
            cancelledAt: new Date().toISOString(),
          }
        : item,
    ),
  };
}

function removeContentItem(
  current: StudioContentPage | undefined,
  itemId: number,
) {
  if (!current) return current;

  const items = current.items.filter((item) => item.id !== itemId);
  if (items.length === current.items.length) return current;

  const totalItems = Math.max(0, current.totalItems - 1);
  return {
    ...current,
    items,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / current.pageSize)),
  };
}
