"use client";

import { IconCategory, IconTag } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  FeaturedVideo as FeaturedVideoData,
  HomeCategorySection,
  HomeFeaturedSettings,
} from "@/lib/home/catalog";
import { FeaturedVideo } from "./featured-video";
import { VideoCarousel } from "./video-carousel";

export function HomeShowcase({
  featuredVideos,
  featuredSettings,
  categorySections,
}: {
  featuredVideos: FeaturedVideoData[];
  featuredSettings: HomeFeaturedSettings;
  categorySections: HomeCategorySection[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerStartRef = useRef(0);
  const activeVideo = featuredVideos[activeIndex] ?? featuredVideos[0];
  const intervalMs = useMemo(() => {
    return Math.max(3, featuredSettings.intervalSeconds) * 1000;
  }, [featuredSettings.intervalSeconds]);

  useEffect(() => {
    if (featuredVideos.length <= 1) {
      return;
    }

    let frameId = 0;
    timerStartRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - timerStartRef.current;
      const nextProgress = Math.min(elapsed / intervalMs, 1);

      setProgress(nextProgress);

      if (elapsed >= intervalMs) {
        timerStartRef.current = now;
        setProgress(0);
        setActiveIndex(
          (currentIndex) => (currentIndex + 1) % featuredVideos.length,
        );
      }

      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [featuredVideos.length, intervalMs]);

  if (!activeVideo) return null;

  function changeFeaturedVideo(direction: -1 | 1) {
    if (featuredVideos.length <= 1) return;

    timerStartRef.current = performance.now();
    setProgress(0);
    setActiveIndex(
      (currentIndex) =>
        (currentIndex + direction + featuredVideos.length) %
        featuredVideos.length,
    );
  }

  return (
    <div className="home-showcase">
      <FeaturedVideo
        activeIndex={activeIndex}
        progress={progress}
        totalVideos={featuredVideos.length}
        video={activeVideo}
        onPrevious={() => changeFeaturedVideo(-1)}
        onNext={() => changeFeaturedVideo(1)}
      />
      <div id="categorias" className="home-category-sections">
        {categorySections.map(({ category, subcategories }) => (
          <section
            key={category.id}
            id={category.anchorId}
            className="home-category-section"
            aria-labelledby={`${category.anchorId}-title`}
          >
            <header className="home-category-section-header">
              <span className="home-category-section-icon" aria-hidden="true">
                <IconCategory stroke={1.8} />
              </span>
              <div className="home-category-section-copy">
                <h2 id={`${category.anchorId}-title`}>{category.label}</h2>
                {category.description ? <p>{category.description}</p> : null}
              </div>
            </header>
            <div className="home-subcategory-stack">
              {subcategories.map(({ subcategory, videos }) => (
                <VideoCarousel
                  key={subcategory.id}
                  headingId={`subcategory-${subcategory.id}-title`}
                  listId={`subcategory-${subcategory.id}-videos`}
                  title={subcategory.label}
                  HeadingIcon={IconTag}
                  videos={videos}
                  categorySlug={category.slug}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
