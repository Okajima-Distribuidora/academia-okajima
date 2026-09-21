"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CommentTextArea } from "@/components/home/comment-text-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_VIDEO_COMMENT_LENGTH } from "@/lib/home/video-comment-rules";
import type {
  VideoComment,
  VideoCommentCursor,
  VideoCommentsPage,
} from "@/lib/home/catalog";

function formatCommentsCount(count: number) {
  return `${new Intl.NumberFormat("pt-BR").format(count)} ${count === 1 ? "comentário" : "comentários"}`;
}

function CommentSkeletons() {
  return (
    <div className="flex flex-col gap-5" aria-label="Carregando comentários" aria-live="polite">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex gap-3" aria-hidden="true">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
      <Spinner className="mx-auto size-6 text-muted-foreground" />
    </div>
  );
}

export function VideoComments({
  videoId,
  viewerInitials,
  initialComments,
  initialNextCursor,
}: {
  videoId: number;
  viewerInitials: string;
  initialComments: VideoComment[];
  initialNextCursor: VideoCommentCursor | null;
}) {
  const [text, setText] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  function clearComment() {
    if (isSaving) return;
    setText("");
    setError(null);
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const commentText = text.trim();
    if (!commentText) {
      setError("Escreva um comentário antes de enviar.");
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/home/video-comment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ videoId, text: commentText }),
      });
      const payload = (await response.json().catch(() => null)) as {
        comment?: VideoComment;
        message?: string;
      } | null;
      if (!response.ok || !payload?.comment) {
        throw new Error(payload?.message ?? "Não foi possível enviar o comentário.");
      }

      setComments((current) => [payload.comment!, ...current]);
      setText("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível enviar o comentário.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const loadMoreComments = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const searchParams = new URLSearchParams({
        videoId: String(videoId),
        cursorPinned: String(nextCursor.pinned),
        cursorTime: String(nextCursor.time),
        cursorId: String(nextCursor.id),
      });
      const response = await fetch(
        `/api/home/video-comment?${searchParams.toString()}`,
      );
      const payload = (await response.json().catch(() => null)) as
        | VideoCommentsPage
        | { message?: string }
        | null;
      if (!response.ok || !payload || !("comments" in payload)) {
        throw new Error(
          payload && "message" in payload && payload.message
            ? payload.message
            : "Não foi possível carregar mais comentários.",
        );
      }

      setComments((current) => [...current, ...payload.comments]);
      setNextCursor(payload.nextCursor);
    } catch (loadingError) {
      setLoadMoreError(
        loadingError instanceof Error
          ? loadingError.message
          : "Não foi possível carregar mais comentários.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, nextCursor, videoId]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !nextCursor || loadMoreError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMoreComments();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMoreComments, loadMoreError, nextCursor]);

  return (
    <section
      className="watch-comments flex min-w-0 flex-col gap-5"
      aria-labelledby="watch-comments-title"
    >
      <h2 id="watch-comments-title" className="text-xl font-semibold tracking-tight">
        {formatCommentsCount(comments.length)}
      </h2>

      <div className="flex gap-3">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground">
            {viewerInitials}
          </AvatarFallback>
        </Avatar>
        <form className="min-w-0 flex-1" onSubmit={submitComment}>
          <FieldGroup className="gap-3">
            <Field data-invalid={Boolean(error)} data-disabled={isSaving}>
              <FieldLabel className="sr-only" htmlFor="video-comment">
                Adicionar comentário
              </FieldLabel>
              <CommentTextArea
                id="video-comment"
                value={text}
                maxLength={MAX_VIDEO_COMMENT_LENGTH}
                disabled={isSaving}
                aria-invalid={Boolean(error)}
                onChange={(event) => setText(event.target.value)}
              />
              <FieldError>{error}</FieldError>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" disabled={isSaving} onClick={clearComment}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || text.trim().length === 0}>
                {isSaving ? <Spinner data-icon="inline-start" /> : null}
                Comentar
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>

      {comments.length > 0 ? (
        <ul className="flex flex-col gap-5" aria-label="Comentários">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar>
                <AvatarFallback>{comment.authorInitials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm font-semibold">
                  {comment.authorName}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {comment.publishedLabel}
                  </span>
                </p>
                <p className="text-sm leading-6 whitespace-pre-wrap">{comment.text}</p>
                <span className="text-xs font-medium text-muted-foreground">
                  {comment.likesLabel}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {nextCursor || isLoadingMore || loadMoreError ? (
        <div ref={loadMoreRef} className="min-h-8">
          {isLoadingMore ? <CommentSkeletons /> : null}
          {loadMoreError ? (
            <div className="flex justify-center">
              <Button type="button" variant="ghost" onClick={() => void loadMoreComments()}>
                Tentar carregar novamente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
