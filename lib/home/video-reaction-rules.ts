export const VIDEO_REACTIONS = ["like", "dislike"] as const;

export type VideoReaction = (typeof VIDEO_REACTIONS)[number];
export type VideoReactionState = VideoReaction | null;

export function nextVideoReaction(
  currentReaction: VideoReactionState,
  requestedReaction: VideoReaction,
): VideoReactionState {
  return currentReaction === requestedReaction ? null : requestedReaction;
}
