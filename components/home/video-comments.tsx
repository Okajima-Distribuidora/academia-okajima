"use client";

import {
  IconChevronDown,
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconPin,
  IconThumbDown,
  IconThumbDownFilled,
  IconThumbUp,
  IconThumbUpFilled,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CommentTextArea } from "@/components/home/comment-text-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type {
  VideoComment,
  VideoCommentCursor,
  VideoCommentReply,
  VideoCommentsPage,
} from "@/lib/home/catalog";
import { MAX_VIDEO_COMMENT_LENGTH } from "@/lib/home/video-comment-rules";
import { cn } from "@/lib/utils";

function formatCommentsCount(count: number) {
  return `${new Intl.NumberFormat("pt-BR").format(count)} ${count === 1 ? "comentário" : "comentários"}`;
}

function CommentSkeletons() {
  return (
    <div
      role="status"
      className="flex flex-col gap-5"
      aria-label="Carregando comentários"
    >
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

function ReactionButtons({
  target,
  id,
  likesCount,
  dislikesCount,
  viewerReaction,
  onChange,
}: {
  target: "comment" | "reply";
  id: number;
  likesCount: number;
  dislikesCount: number;
  viewerReaction: "like" | "dislike" | null;
  onChange: (reaction: "like" | "dislike" | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  async function react(reaction: "like" | "dislike") {
    if (isSaving) return;
    const next = viewerReaction === reaction ? null : reaction;
    setIsSaving(true);
    try {
      const response = await fetch("/api/home/comment-reaction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, id, reaction: next }),
      });
      if (!response.ok) throw new Error();
      onChange(next);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        disabled={isSaving}
        aria-pressed={viewerReaction === "like"}
        onClick={() => void react("like")}
      >
        {viewerReaction === "like" ? <IconThumbUpFilled /> : <IconThumbUp />}
        {likesCount ? (
          <span className="font-normal text-muted-foreground">
            {likesCount}
          </span>
        ) : null}
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={isSaving}
        aria-pressed={viewerReaction === "dislike"}
        onClick={() => void react("dislike")}
      >
        {viewerReaction === "dislike" ? (
          <IconThumbDownFilled />
        ) : (
          <IconThumbDown />
        )}
        {dislikesCount ? (
          <span className="font-normal text-muted-foreground">
            {dislikesCount}
          </span>
        ) : null}
      </Button>
    </div>
  );
}

export function VideoComments({
  videoId,
  viewerInitials,
  isStudioAdmin,
  initialComments,
  initialNextCursor,
}: {
  videoId: number;
  viewerInitials: string;
  isStudioAdmin: boolean;
  initialComments: VideoComment[];
  initialNextCursor: VideoCommentCursor | null;
}) {
  const [text, setText] = useState("");
  const [isComposerActive, setIsComposerActive] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{
    comment: VideoComment;
    parentReply?: VideoCommentReply;
  } | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isReplySaving, setIsReplySaving] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(
    () => new Set(),
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);

  function updateComment(
    commentId: number,
    update: (comment: VideoComment) => VideoComment,
  ) {
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId ? update(comment) : comment,
      ),
    );
  }
  function updateReply(
    commentId: number,
    replyId: number,
    update: (reply: VideoCommentReply) => VideoCommentReply,
  ) {
    updateComment(commentId, (comment) => ({
      ...comment,
      replies: comment.replies.map((reply) =>
        reply.id === replyId ? update(reply) : reply,
      ),
    }));
  }

  async function addReply() {
    if (!replyTarget || !replyText.trim()) return;
    const { comment, parentReply } = replyTarget;
    setIsReplySaving(true);
    setReplyError(null);
    try {
      const response = await fetch("/api/home/comment-reply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          videoId,
          commentId: comment.id,
          parentReplyId: parentReply?.id ?? null,
          text: replyText.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        reply?: VideoCommentReply;
        message?: string;
      } | null;
      if (!response.ok || !payload?.reply) {
        setReplyError(
          payload?.message ?? "Não foi possível enviar a resposta.",
        );
        return;
      }
      const reply = parentReply
        ? { ...payload.reply, replyToAuthorName: parentReply.authorName }
        : payload.reply;
      updateComment(comment.id, (current) => ({
        ...current,
        replies: [...current.replies, reply],
      }));
      setReplyTarget(null);
      setReplyText("");
    } catch {
      setReplyError("Não foi possível enviar a resposta.");
    } finally {
      setIsReplySaving(false);
    }
  }

  async function togglePin(comment: VideoComment) {
    const response = await fetch("/api/home/comment-pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        videoId,
        commentId: comment.id,
        pinned: !comment.isPinned,
      }),
    });
    if (!response.ok) return;
    setComments((current) =>
      current.map((entry) => ({
        ...entry,
        isPinned: entry.id === comment.id ? !comment.isPinned : false,
      })),
    );
  }

  async function toggleVisibility(comment: VideoComment) {
    const response = await fetch("/api/home/comment-visibility", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        videoId,
        commentId: comment.id,
        hidden: !comment.isHidden,
      }),
    });
    if (!response.ok) return;
    updateComment(comment.id, (current) => ({
      ...current,
      isHidden: !comment.isHidden,
    }));
  }

  function clearComment() {
    if (isSaving) return;
    setText("");
    setError(null);
    setIsComposerActive(false);
  }

  function toggleReplies(commentId: number) {
    setExpandedReplies((current) => {
      const next = new Set(current);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
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
        throw new Error(
          payload?.message ?? "Não foi possível enviar o comentário.",
        );
      }

      setComments((current) => {
        const firstUnpinnedIndex = current.findIndex(
          (comment) => !comment.isPinned,
        );
        if (firstUnpinnedIndex === -1) return [...current, payload.comment!];
        return [
          ...current.slice(0, firstUnpinnedIndex),
          payload.comment!,
          ...current.slice(firstUnpinnedIndex),
        ];
      });
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
      <h2
        id="watch-comments-title"
        className="text-xl font-semibold tracking-tight"
      >
        {formatCommentsCount(comments.length)}
      </h2>

      <div className="flex gap-3">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {viewerInitials}
          </AvatarFallback>
        </Avatar>
        <form className="min-w-0 flex-1" onSubmit={submitComment}>
          <FieldGroup className="gap-2">
            <Field data-invalid={Boolean(error)} data-disabled={isSaving}>
              <FieldLabel className="sr-only" htmlFor="video-comment">
                Adicionar comentário
              </FieldLabel>
              <CommentTextArea
                id="video-comment"
                rows={1}
                value={text}
                maxLength={MAX_VIDEO_COMMENT_LENGTH}
                disabled={isSaving}
                aria-invalid={Boolean(error)}
                className="min-h-0 resize-none rounded-none border-x-0 border-t-0 border-b px-0 py-1.5 shadow-none focus-visible:border-primary focus-visible:ring-0"
                onChange={(event) => setText(event.target.value)}
                onFocus={() => setIsComposerActive(true)}
              />
              <FieldError>{error}</FieldError>
            </Field>
            {isComposerActive || text.trim().length > 0 ? (
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSaving}
                  onClick={clearComment}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || text.trim().length === 0}
                >
                  {isSaving ? <Spinner data-icon="inline-start" /> : null}
                  Comentar
                </Button>
              </div>
            ) : null}
          </FieldGroup>
        </form>
      </div>

      {comments.length > 0 ? (
        <ul className="flex flex-col gap-7" aria-label="Comentários">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={cn("flex gap-3", comment.isHidden && "opacity-60")}
            >
              <Avatar className="size-9 shrink-0">
                <AvatarFallback>{comment.authorInitials}</AvatarFallback>
              </Avatar>
              <div className="relative min-w-0 flex-1">
                <div className="flex items-start">
                  <div className="min-w-0 flex-1 pr-10">
                    <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold">
                      @{comment.authorName}
                      <span className="font-normal text-muted-foreground">
                        {comment.publishedLabel}
                      </span>
                      {comment.isPinned ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <IconPin className="size-3" />
                          Fixado
                        </span>
                      ) : null}
                      {comment.isHidden ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          Oculto
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
                {isStudioAdmin ? (
                  <div className="absolute top-0 right-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            aria-label="Opções do comentário"
                          />
                        }
                      >
                        <IconDotsVertical />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="whitespace-nowrap"
                            onClick={() => void togglePin(comment)}
                          >
                            <IconPin data-icon="inline-start" />
                            {comment.isPinned
                              ? "Desafixar"
                              : "Fixar comentário"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="whitespace-nowrap"
                            onClick={() => void toggleVisibility(comment)}
                          >
                            {comment.isHidden ? (
                              <IconEye data-icon="inline-start" />
                            ) : (
                              <IconEyeOff data-icon="inline-start" />
                            )}
                            {comment.isHidden
                              ? "Exibir comentário"
                              : "Ocultar comentário"}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : null}
                <p className="mt-0.5 text-base leading-6 whitespace-pre-wrap">
                  {comment.text}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  <ReactionButtons
                    target="comment"
                    id={comment.id}
                    likesCount={comment.likesCount}
                    dislikesCount={comment.dislikesCount}
                    viewerReaction={comment.viewerReaction}
                    onChange={(reaction) =>
                      updateComment(comment.id, (current) => ({
                        ...current,
                        viewerReaction: reaction,
                        likesCount:
                          current.likesCount +
                          (reaction === "like" ? 1 : 0) -
                          (current.viewerReaction === "like" ? 1 : 0),
                        dislikesCount:
                          current.dislikesCount +
                          (reaction === "dislike" ? 1 : 0) -
                          (current.viewerReaction === "dislike" ? 1 : 0),
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setReplyTarget({ comment });
                      setReplyError(null);
                    }}
                  >
                    Responder
                  </Button>
                </div>
                {comment.replies.length ? (
                  <div className="mt-2 border-l border-border pl-4">
                    <Button
                      type="button"
                      variant="ghost"
                      className="-ml-2 text-foreground"
                      onClick={() => toggleReplies(comment.id)}
                    >
                      {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "resposta" : "respostas"}
                      <IconChevronDown
                        className={
                          expandedReplies.has(comment.id)
                            ? "rotate-180 transition-transform"
                            : "transition-transform"
                        }
                      />
                    </Button>
                  </div>
                ) : null}
                {comment.replies.length && expandedReplies.has(comment.id) ? (
                  <ul
                    className="flex flex-col gap-4 border-l pl-4"
                    aria-label={`Respostas a ${comment.authorName}`}
                  >
                    {comment.replies.map((reply) => (
                      <li key={reply.id} className="flex gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback>
                            {reply.authorInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold">
                            @{reply.authorName}
                            <span className="ml-2 font-normal text-muted-foreground">
                              {reply.publishedLabel}
                            </span>
                          </p>
                          <p className="mt-0.5 text-sm leading-6 whitespace-pre-wrap">
                            {reply.replyToAuthorName ? (
                              <span className="font-medium text-primary">
                                @{reply.replyToAuthorName}{" "}
                              </span>
                            ) : null}
                            {reply.text}
                          </p>
                          <div className="mt-3 flex items-center gap-1">
                            <ReactionButtons
                              target="reply"
                              id={reply.id}
                              likesCount={reply.likesCount}
                              dislikesCount={reply.dislikesCount}
                              viewerReaction={reply.viewerReaction}
                              onChange={(reaction) =>
                                updateReply(
                                  comment.id,
                                  reply.id,
                                  (current) => ({
                                    ...current,
                                    viewerReaction: reaction,
                                    likesCount:
                                      current.likesCount +
                                      (reaction === "like" ? 1 : 0) -
                                      (current.viewerReaction === "like"
                                        ? 1
                                        : 0),
                                    dislikesCount:
                                      current.dislikesCount +
                                      (reaction === "dislike" ? 1 : 0) -
                                      (current.viewerReaction === "dislike"
                                        ? 1
                                        : 0),
                                  }),
                                )
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplyTarget({ comment, parentReply: reply });
                                setReplyError(null);
                              }}
                            >
                              Responder
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {replyTarget?.comment.id === comment.id ? (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void addReply();
                    }}
                  >
                    <CommentTextArea
                      value={replyText}
                      maxLength={MAX_VIDEO_COMMENT_LENGTH}
                      disabled={isReplySaving}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder={
                        replyTarget.parentReply
                          ? `Responder a ${replyTarget.parentReply.authorName}`
                          : "Escreva uma resposta"
                      }
                    />
                    <div className="flex shrink-0 flex-col gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isReplySaving || !replyText.trim()}
                      >
                        Responder
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isReplySaving}
                        onClick={() => {
                          setReplyTarget(null);
                          setReplyText("");
                        }}
                      >
                        Cancelar
                      </Button>
                      {replyError ? (
                        <p className="max-w-48 text-xs text-destructive">
                          {replyError}
                        </p>
                      ) : null}
                    </div>
                  </form>
                ) : null}
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
              <Button
                type="button"
                variant="ghost"
                onClick={() => void loadMoreComments()}
              >
                Tentar carregar novamente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
