import { Brand } from "@/components/brand";
import { ThemeSelector } from "@/components/theme-selector";
import { Separator } from "@/components/ui/separator";

export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:p-3 focus:text-primary"
      >
        Pular para o conteúdo
      </a>
      <header className="flex h-15 shrink-0 items-center justify-between gap-3 px-5 sm:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeSelector compact />
          {children}
        </div>
      </header>
      <Separator />
    </>
  );
}
