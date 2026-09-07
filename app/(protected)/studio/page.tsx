import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import studioIcon from "@/app/icon.png";
import { buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Academia Studio" };

export default async function StudioPage() {
  await requireUser();

  return <main id="conteudo" tabIndex={-1} className="home-content flex flex-1 flex-col p-5 outline-none sm:p-8">
    <h1 className="text-2xl font-semibold tracking-tight">Academia Studio</h1>
    <Empty>
      <EmptyHeader>
        <EmptyMedia><Image src={studioIcon} alt="" width={44} height={44} /></EmptyMedia>
        <EmptyTitle>Seu espaço para publicar vídeos</EmptyTitle>
        <EmptyDescription>Em breve, envie e gerencie os conteúdos da Academia por aqui.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href="/" className={cn(buttonVariants({ variant: "outline-transparent" }))}>Voltar para a Academia</Link>
      </EmptyContent>
    </Empty>
  </main>;
}
