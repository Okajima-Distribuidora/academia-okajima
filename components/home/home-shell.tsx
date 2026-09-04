"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { IconMenu2, IconSearch } from "@tabler/icons-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HomeSidebar } from "./home-sidebar";
import { HomeSearch } from "./home-search";
import { UserMenu } from "./user-menu";

function MenuToggle() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const expanded = isMobile ? openMobile : open;
  const label = isMobile ? "Abrir menu lateral" : expanded ? "Recolher menu lateral" : "Expandir menu lateral";
  return <Button variant="ghost" size="icon-lg" className="home-topbar-icon size-11 rounded-full" aria-label={label}
    aria-expanded={expanded} onClick={toggleSidebar}>
    <IconMenu2 aria-hidden="true" stroke={1.7} />
  </Button>;
}

function HomeTopbar({ name, rca }: { name: string; rca: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const wasSearchOpen = useRef(false);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus({ preventScroll: true });
    else if (wasSearchOpen.current && searchTriggerRef.current?.getClientRects().length) {
      searchTriggerRef.current.focus({ preventScroll: true });
    }
    wasSearchOpen.current = searchOpen;
  }, [searchOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const resetMobileSearch = () => { if (desktop.matches) setSearchOpen(false); };
    desktop.addEventListener("change", resetMobileSearch);
    return () => desktop.removeEventListener("change", resetMobileSearch);
  }, []);

  return <header className="home-topbar" data-search-open={searchOpen}>
    <div className="home-topbar-brand flex min-w-0 items-center gap-1 sm:gap-3"><MenuToggle /><Brand /></div>
    <div id="home-topbar-search" className="home-topbar-search" onKeyDown={(event) => {
      if (searchOpen && event.key === "Escape" && !event.nativeEvent.isComposing) {
        event.preventDefault();
        setSearchOpen(false);
      }
    }}>
      <HomeSearch inputRef={inputRef} />
    </div>
    <div className="home-topbar-actions flex items-center justify-end gap-1 sm:gap-2">
      <Button ref={searchTriggerRef} type="button" variant="ghost" size="icon"
        className="home-topbar-icon home-search-trigger rounded-full md:hidden" aria-label={searchOpen ? "Fechar pesquisa" : "Abrir pesquisa"}
        aria-controls="home-topbar-search" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)}>
        <IconSearch aria-hidden="true" stroke={1.7} />
      </Button>
      <UserMenu name={name} rca={rca} />
    </div>
  </header>;
}

export function HomeShell({ children, name, rca }: { children: ReactNode; name: string; rca: string }) {
  return <TooltipProvider delay={200}>
    <SidebarProvider className="home-shell flex-col" style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "4.5rem" } as CSSProperties}>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:p-3 focus:text-primary">Pular para o conteúdo</a>
      <HomeTopbar name={name} rca={rca} />
      <div className="flex min-w-0 flex-1">
        <HomeSidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SidebarProvider>
  </TooltipProvider>;
}
