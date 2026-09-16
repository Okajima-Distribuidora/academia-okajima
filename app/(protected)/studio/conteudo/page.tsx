import type { Metadata } from "next";

import { ContentManager } from "@/components/studio/content/content-manager";
import { StudioPageFrame } from "@/components/studio/layout/studio-page-frame";
import { requireStudioUser } from "@/lib/auth/session";
import {
  getStudioContentPage,
  getStudioContentType,
  listStudioContent,
} from "@/lib/studio/content";

export const metadata: Metadata = { title: "Conteúdo | Academia Studio" };

export default async function StudioContentPage({
  searchParams,
}: PageProps<"/studio/conteudo">) {
  await requireStudioUser();
  const params = await searchParams;
  const activeType = getStudioContentType(params.tipo);
  const activePage = getStudioContentPage(params.pagina);
  const content = await listStudioContent(activeType, activePage);

  return (
    <StudioPageFrame>
      <ContentManager
        activeType={activeType}
        content={content}
      />
    </StudioPageFrame>
  );
}
