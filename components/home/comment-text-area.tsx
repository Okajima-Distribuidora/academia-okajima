"use client";

import { Textarea } from "@/components/ui/textarea";

export function CommentTextArea(
  props: React.ComponentProps<typeof Textarea>,
) {
  return (
    <Textarea
      rows={4}
      placeholder="Adicione um comentário"
      aria-label="Adicionar comentário"
      className="comment-text-area min-h-24 resize-y"
      {...props}
    />
  );
}
