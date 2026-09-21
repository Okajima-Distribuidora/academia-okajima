import { Skeleton } from "@/components/ui/skeleton";

function LoadingSidebar() {
  return (
    <aside
      aria-hidden="true"
      className="hidden w-60 shrink-0 border-r border-border p-4 md:flex md:flex-col md:gap-6"
    >
      <Skeleton className="h-8 w-32" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
      <div className="mt-auto flex items-center gap-3">
        <Skeleton className="size-9 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </aside>
  );
}

/**
 * Shared shell fallback for authenticated routes.
 *
 * It is intentionally independent of user and navigation data, so it can
 * stream before the protected layout resolves its session and catalog queries.
 */
export function ProtectedShellLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando Academia"
      className="flex min-h-dvh flex-col bg-background"
    >
      <header className="flex h-16 items-center justify-between border-b border-border px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-7 w-32" />
        </div>
        <Skeleton className="size-9 rounded-full" />
      </header>
      <div className="flex min-w-0 flex-1">
        <LoadingSidebar />
        <ProtectedContentLoading />
      </div>
    </div>
  );
}

/**
 * Route-level fallback rendered inside the resolved protected shell.
 * It deliberately contains only page content to avoid nesting a second sidebar.
 */
export function ProtectedContentLoading() {
  return (
    <main
      id="conteudo"
      className="flex min-w-0 flex-1 flex-col gap-8 p-5 sm:p-8 lg:px-10"
    >
      <section className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[16/7] w-full rounded-xl" />
      </section>
      <section className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-44 w-72 shrink-0 rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}
