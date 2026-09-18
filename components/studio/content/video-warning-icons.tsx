"use client";

import { IconCategoryMinus, IconFileDescription } from "@tabler/icons-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { StudioVideoWarning } from "@/lib/studio/content/warnings";

const warningDetails = {
  "missing-category": {
    title: "Sem categoria",
    description:
      "Este vídeo ainda não está vinculado a uma subcategoria da Academia.",
    icon: IconCategoryMinus,
  },
  "missing-description": {
    title: "Sem descrição",
    description: "Adicione uma descrição para contextualizar este vídeo.",
    icon: IconFileDescription,
  },
} as const;

export function VideoWarningIcons({
  warnings,
}: {
  warnings: StudioVideoWarning[];
}) {
  if (warnings.length === 0) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Avisos do vídeo"
    >
      {warnings.map((warning) => {
        const details = warningDetails[warning];
        const Icon = details.icon;

        return (
          <HoverCard key={warning}>
            <HoverCardTrigger
              delay={100}
              closeDelay={150}
              render={
                <button
                  type="button"
                  className="grid size-7 place-items-center rounded-full border border-warning/40 bg-warning/10 text-warning outline-none transition-colors hover:bg-warning/20 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={details.title}
                />
              }
            >
              <Icon stroke={1.8} size={22} />
            </HoverCardTrigger>
            <HoverCardContent
              align="start"
              side="top"
              className="flex flex-col gap-1.5"
            >
              <p className="font-semibold">{details.title}</p>
              <p className="text-muted-foreground">{details.description}</p>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}
