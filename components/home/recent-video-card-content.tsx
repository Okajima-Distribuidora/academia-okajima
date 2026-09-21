import {
  IconPlayerPlayFilled,
  IconRosetteDiscountCheck,
  IconRosetteDiscountCheckFilled,
  IconVideo,
} from "@tabler/icons-react";
import Image from "next/image";

import { VideoHoverPreview } from "@/components/home/video-hover-preview";
import type { RecentVideo } from "@/lib/home/catalog";

export function RecentVideoCardContent({
  video,
  priority = false,
  sizes = "(max-width: 639px) 94vw, (max-width: 1199px) 20.5rem, 28vw",
}: {
  video: RecentVideo;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <>
      <span className="home-recent-thumbnail">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt=""
            fill
            priority={priority}
            loading="eager"
            sizes={sizes}
            className="home-recent-image object-cover"
          />
        ) : (
          <IconVideo
            className="home-recent-placeholder-icon"
            aria-hidden="true"
            stroke={1.4}
          />
        )}
        <VideoHoverPreview title={video.title} vimeoId={video.vimeoId} />
        <span className="home-recent-play" aria-hidden="true">
          <IconPlayerPlayFilled />
        </span>
        {video.duration ? (
          <span className="home-recent-duration">{video.duration}</span>
        ) : null}
      </span>
      <span className="home-recent-copy">
        <strong>{video.title}</strong>
        <span className="home-recent-category">
          {video.categoryLabel ?? "Academia Okajima"}
          <IconRosetteDiscountCheckFilled aria-hidden="true" stroke={2} />
        </span>
        <span className="home-recent-meta">
          {video.viewsLabel} · {video.publishedLabel}
        </span>
      </span>
    </>
  );
}
