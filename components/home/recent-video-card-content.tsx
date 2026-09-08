import Image from "next/image";
import { IconPlayerPlayFilled, IconVideo } from "@tabler/icons-react";

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
            sizes={sizes}
            className="home-recent-image object-cover"
          />
        ) : (
          <IconVideo className="home-recent-placeholder-icon" aria-hidden="true" stroke={1.4} />
        )}
        <span className="home-recent-play" aria-hidden="true">
          <IconPlayerPlayFilled />
        </span>
        {video.duration ? <span className="home-recent-duration">{video.duration}</span> : null}
      </span>
      <span className="home-recent-copy">
        <strong>{video.title}</strong>
        <span>{video.categoryLabel ?? "Academia Okajima"}</span>
        <span>{video.viewsLabel} · {video.publishedLabel}</span>
      </span>
    </>
  );
}
