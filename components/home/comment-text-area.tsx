"use client";

import { Input } from "antd";

const { TextArea } = Input;

export function CommentTextArea() {
  return (
    <TextArea
      rows={4}
      placeholder="Adicione um comentário"
      aria-label="Adicionar comentário"
      autoSize={{ minRows: 3, maxRows: 6 }}
      className="comment-text-area"
    />
  );
}
