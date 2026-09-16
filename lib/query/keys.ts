export const queryKeys = {
  studio: {
    all: ["studio"] as const,
    content: {
      all: ["studio", "content"] as const,
      page: (type: "videos" | "shorts", page: number) =>
        ["studio", "content", type, page] as const,
    },
  },
} as const;
