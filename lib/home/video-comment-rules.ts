export const MAX_VIDEO_COMMENT_LENGTH = 2_000;

export function normalizeVideoCommentText(value: string) {
  const text = value.trim();
  return text.length > 0 && text.length <= MAX_VIDEO_COMMENT_LENGTH
    ? text
    : null;
}
