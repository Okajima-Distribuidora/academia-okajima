"use client";

import { IconMenu2, IconSearch, IconVideoPlus } from "@tabler/icons-react";
import { ArrowUpFromLine, SquarePen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import studioIcon from "@/app/icon.png";
import { AdminSidebar } from "@/components/admin/layout/admin-sidebar";
import { Brand } from "@/components/brand";
import { StudioSidebar } from "@/components/studio/layout/studio-sidebar";
import { StudioSidebarStateProvider } from "@/components/studio/layout/studio-sidebar-context";
import {
  useVideoUploadDialog,
  VideoUploadDialogProvider,
} from "@/components/studio/uploads/video-upload-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { HomeCategory, HomeCategoryNavigation } from "@/lib/home/catalog";
import type { StudioCategory } from "@/lib/studio/categories/types";
import { cn } from "@/lib/utils";
import { CategoryFilter } from "./category-filter";
import { HomeSearch } from "./home-search";
import { HomeSidebar } from "./home-sidebar";

function MenuToggle() {
  const { open, openMobile, isMobile, toggleSidebar } = useSidebar();
  const expanded = isMobile ? openMobile : open;
  const label = isMobile
    ? "Abrir menu lateral"
    : expanded
      ? "Recolher menu lateral"
      : "Expandir menu lateral";
  return (
    <Button
      variant="ghost"
      size="icon-lg"
      className="home-topbar-icon size-11 rounded-full"
      aria-label={label}
      aria-expanded={expanded}
      onClick={toggleSidebar}
    >
      <IconMenu2 aria-hidden="true" stroke={1.7} />
    </Button>
  );
}

function HomeTopbar({
  categories,
  isStudioAdmin,
}: {
  categories: HomeCategory[];
  isStudioAdmin: boolean;
}) {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");
  const showHomeCategories = pathname === "/" && categories.length > 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [studioPressed, setStudioPressed] = useState(false);
  const openVideoUploadDialog = useVideoUploadDialog();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const wasSearchOpen = useRef(false);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => {
        const searchInput = document.getElementById("home-search");
        if (searchInput instanceof HTMLInputElement) {
          searchInput.focus({ preventScroll: true });
        }
      }, 40);
    } else if (
      wasSearchOpen.current &&
      searchTriggerRef.current?.getClientRects().length
    ) {
      searchTriggerRef.current.focus({ preventScroll: true });
    }
    wasSearchOpen.current = searchOpen;
  }, [searchOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const resetMobileSearch = () => {
      if (desktop.matches) setSearchOpen(false);
    };
    desktop.addEventListener("change", resetMobileSearch);
    return () => desktop.removeEventListener("change", resetMobileSearch);
  }, []);

  return (
    <header className="home-topbar" data-search-open={searchOpen}>
      <div className="home-topbar-brand flex min-w-0 items-center gap-1 sm:gap-3">
        <MenuToggle />
        <Brand />
      </div>
      {showHomeCategories ? <CategoryFilter categories={categories} /> : null}
      <div
        id="home-topbar-search"
        className="home-topbar-search"
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisar vídeos"
        onClick={(event) => {
          if (event.target === event.currentTarget) setSearchOpen(false);
        }}
        onKeyDown={(event) => {
          if (
            searchOpen &&
            event.key === "Escape" &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            setSearchOpen(false);
          }
        }}
      >
        <HomeSearch
          inputRef={inputRef}
          onNavigate={() => setSearchOpen(false)}
        />
      </div>
      <div className="home-topbar-actions flex items-center justify-end gap-1 sm:gap-2">
        <Button
          ref={searchTriggerRef}
          type="button"
          variant="ghost"
          size="icon"
          className="home-topbar-icon home-search-trigger size-8 rounded-full sm:size-9"
          aria-label={searchOpen ? "Fechar pesquisa" : "Abrir pesquisa"}
          aria-controls="home-topbar-search"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        >
          <IconSearch aria-hidden="true" stroke={1.7} />
        </Button>
        {isStudioAdmin && isStudio ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline-transparent"
                  className="home-studio-link size-8 rounded-full p-0 has-data-[icon=inline-start]:pl-0 has-data-[icon=inline-start]:pr-0 sm:h-9 sm:w-auto sm:gap-2 sm:px-3 sm:has-data-[icon=inline-start]:pl-2 sm:has-data-[icon=inline-start]:pr-3"
                />
              }
              aria-label="Criar conteúdo"
            >
              <IconVideoPlus
                data-icon="inline-start"
                className="size-5"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Criar</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-56 rounded-xl p-2"
            >
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="h-9 gap-3 rounded-lg px-3 text-sm font-medium"
                  onClick={openVideoUploadDialog}
                >
                  <ArrowUpFromLine aria-hidden="true" />
                  Enviar vídeos
                </DropdownMenuItem>
                <DropdownMenuItem className="h-9 gap-3 rounded-lg px-3 text-sm font-medium">
                  <SquarePen aria-hidden="true" />
                  Enviar arquivos
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : isStudioAdmin ? (
          <Link
            href="/studio"
            aria-label="Academia Studio"
            title="Academia Studio"
            aria-current={pathname === "/studio" ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "outline-transparent" }),
              "home-studio-link size-8 rounded-full p-0 sm:h-9 sm:w-auto sm:gap-2 sm:px-3",
              studioPressed && "is-pressing",
            )}
            onPointerDown={() => setStudioPressed(true)}
            onPointerLeave={() => setStudioPressed(false)}
            onPointerUp={() => setStudioPressed(false)}
            onClick={() => {
              setStudioPressed(true);
              window.setTimeout(() => setStudioPressed(false), 260);
            }}
          >
            <Image
              src={studioIcon}
              alt=""
              width={22}
              height={22}
              loading="eager"
              className="size-5 shrink-0 object-contain sm:size-5.5"
            />
            <span className="hidden sm:inline">Academia Studio</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function HomeShell({
  children,
  name,
  rca,
  categories,
  categoryNavigation,
  studioCategories,
  isStudioAdmin,
}: {
  children: ReactNode;
  name: string;
  rca: string;
  categories: HomeCategory[];
  categoryNavigation: HomeCategoryNavigation[];
  studioCategories: StudioCategory[];
  isStudioAdmin: boolean;
}) {
  const pathname = usePathname();
  const isStudio = pathname.startsWith("/studio");
  const isAdmin = pathname.startsWith("/admin");

  return (
    <VideoUploadDialogProvider categories={studioCategories}>
      <TooltipProvider delay={200}>
        <StudioSidebarStateProvider>
          <SidebarProvider
            className="home-shell flex-col"
            style={
              {
                "--sidebar-width": "15rem",
                "--sidebar-width-icon": "4.5rem",
              } as CSSProperties
            }
          >
            <a
              href="#conteudo"
              className="sr-only focus:not-sr-only focus:p-3 focus:text-primary"
            >
              Pular para o conteúdo
            </a>
            <HomeTopbar categories={categories} isStudioAdmin={isStudioAdmin} />
            <div className="flex min-w-0 flex-1">
              {isAdmin ? (
                <AdminSidebar name={name} rca={rca} />
              ) : isStudio ? (
                <StudioSidebar name={name} rca={rca} />
              ) : (
                <HomeSidebar
                  name={name}
                  rca={rca}
                  categories={categoryNavigation}
                  isStudioAdmin={isStudioAdmin}
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col">{children}</div>
            </div>
          </SidebarProvider>
        </StudioSidebarStateProvider>
      </TooltipProvider>
    </VideoUploadDialogProvider>
  );
}
