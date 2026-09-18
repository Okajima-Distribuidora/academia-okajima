export const queryKeys = {
  admin: {
    all: ["admin"] as const,
    users: {
      all: ["admin", "users"] as const,
      page: (page: number, pageSize: number, search: string) =>
        ["admin", "users", "page", page, pageSize, search] as const,
    },
  },
  studio: {
    all: ["studio"] as const,
    content: {
      all: ["studio", "content"] as const,
      page: (type: "videos" | "shorts", page: number) =>
        ["studio", "content", type, page] as const,
    },
  },
} as const;
