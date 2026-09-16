import type { ReactNode } from "react";

import { requireStudioUser } from "@/lib/auth/session";

export default async function StudioLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireStudioUser();

  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="home-content flex min-w-0 flex-1 flex-col bg-soft outline-none"
    >
      {children}
    </main>
  );
}
