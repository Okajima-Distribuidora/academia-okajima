import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function StudioPageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col gap-6 p-5 sm:p-8 lg:p-10",
        className,
      )}
    >
      {children}
    </section>
  );
}
