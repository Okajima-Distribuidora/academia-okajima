"use client";

import {
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  nextVideoReaction,
  type VideoReaction,
  type VideoReactionState,
} from "@/lib/home/video-reaction-rules";
import { cn } from "@/lib/utils";

function formatLikes(count: number) {
  const units = [
    { value: 1_000_000_000, suffix: "bi" },
    { value: 1_000_000, suffix: "mi" },
    { value: 1_000, suffix: "mil" },
  ];
  const unit = units.find(({ value }) => count >= value);
  if (!unit) return new Intl.NumberFormat("pt-BR").format(count);

  const abbreviated = count / unit.value;
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(abbreviated)} ${unit.suffix}`;
}

export function VideoReactions({
  videoId,
  initialLikesCount,
  initialReaction,
}: {
  videoId: number;
  initialLikesCount: number;
  initialReaction: VideoReactionState;
}) {
  const [reaction, setReaction] = useState(initialReaction);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSaving, setIsSaving] = useState(false);

  async function submitReaction(requestedReaction: VideoReaction) {
    if (isSaving) return;

    const previousReaction = reaction;
    const previousLikesCount = likesCount;
    const nextReaction = nextVideoReaction(reaction, requestedReaction);
    const likesDelta =
      (nextReaction === "like" ? 1 : 0) -
      (previousReaction === "like" ? 1 : 0);

    setReaction(nextReaction);
    setLikesCount((count) => count + likesDelta);
    setIsSaving(true);

    try {
      const response = await fetch("/api/home/video-reaction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoId, reaction: nextReaction }),
      });
      if (!response.ok) throw new Error("Não foi possível salvar a reação.");

      const result = (await response.json()) as {
        likesCount: number;
        viewerReaction: VideoReactionState;
      };
      setReaction(result.viewerReaction);
      setLikesCount(result.likesCount);
    } catch {
      setReaction(previousReaction);
      setLikesCount(previousLikesCount);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ButtonGroup className="watch-reaction-group" aria-label="Avaliar vídeo">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className={cn(
          "watch-reaction-like",
          reaction === "like" && "watch-reaction-selected",
        )}
        aria-pressed={reaction === "like"}
        aria-label="Gostei"
        disabled={isSaving}
        onClick={() => submitReaction("like")}
      >
        {reaction === "like" ? (
          <IconThumbUpFilled data-icon="inline-start" aria-hidden="true" />
        ) : (
          <IconThumbUp data-icon="inline-start" aria-hidden="true" />
        )}
        {formatLikes(likesCount)}
      </Button>
      <ButtonGroupSeparator />
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        className={cn(
          "watch-reaction-dislike",
          reaction === "dislike" && "watch-reaction-selected",
        )}
        aria-pressed={reaction === "dislike"}
        aria-label="Não gostei"
        disabled={isSaving}
        onClick={() => submitReaction("dislike")}
      >
        {reaction === "dislike" ? (
          <IconThumbDownFilled aria-hidden="true" />
        ) : (
          <IconThumbDown aria-hidden="true" />
        )}
      </Button>
    </ButtonGroup>
  );
}
