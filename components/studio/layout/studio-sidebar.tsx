"use client";

import {
  IconArrowLeft,
  IconBrandYoutube,
  IconChartBar,
  IconChevronsUp,
  IconFolder,
  IconLayoutDashboard,
  IconPencil,
  IconSubtask,
  IconVideo,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/home/user-menu";
import { useStudioSidebarState } from "@/components/studio/layout/studio-sidebar-context";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const editorNavigation = [
  { id: "details", label: "Detalhes", icon: IconPencil },
  { id: null, label: "Analytics", icon: IconChartBar },
  { id: "comments", label: "Comentários", icon: IconSubtask },
  { id: null, label: "Categorias", icon: IconFolder },
] as const;

export function StudioSidebar({ name, rca }: { name: string; rca: string }) {
  const pathname = usePathname();
  const isVideoEditor = /^\/studio\/conteudo\/[^/]+$/.test(pathname);
  const showStudioNavigation = !isVideoEditor;
  const { activeEditorSection, setActiveEditorSection, videoDetails } =
    useStudioSidebarState();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const navigation = [
    {
      href: "/studio/dashboard",
      label: "Dashboard",
      icon: IconLayoutDashboard,
      active: pathname === "/studio" || pathname === "/studio/dashboard",
    },
    {
      href: "/studio/categorias",
      label: "Categorias",
      icon: IconFolder,
      active: pathname === "/studio/categorias",
    },
    {
      href: "/studio/conteudo",
      label: "Conteúdo",
      icon: IconBrandYoutube,
      active: pathname.startsWith("/studio/conteudo"),
    },
    {
      href: "/studio/destaque",
      label: "Destaque",
      icon: IconChevronsUp,
      active: pathname === "/studio/destaque",
    },
  ];

  return (
    <Sidebar collapsible="icon" className="home-sidebar-panel">
      {isVideoEditor ? (
        <SidebarHeader className="px-4 py-4 group-data-[collapsible=icon]:hidden">
          <div className="flex h-10 items-center gap-3">
            <Button
              variant="ghost"
              size="lg"
              className="min-w-0 flex-1 justify-start gap-4 px-2"
              nativeButton={false}
              render={<Link href="/studio/conteudo" />}
              aria-label="Voltar para conteúdo"
              onClick={closeMobile}
            >
              <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
              <span className="truncate text-xl font-semibold">
                Conteúdo do canal
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto md:hidden"
              aria-label="Fechar menu lateral"
              onClick={() => setOpenMobile(false)}
            >
              <IconX aria-hidden="true" />
            </Button>
          </div>
        </SidebarHeader>
      ) : (
        <SidebarHeader className="md:hidden">
          <div className="flex h-12 items-center justify-between gap-2 px-2">
            <Brand />
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-11"
              aria-label="Fechar menu lateral"
              onClick={() => setOpenMobile(false)}
            >
              <IconX aria-hidden="true" />
            </Button>
          </div>
        </SidebarHeader>
      )}
      {showStudioNavigation ? (
        <SidebarContent>
          <SidebarGroup className="px-3 pt-5 pb-3">
            <SidebarGroupContent>
              <nav aria-label="Academia Studio">
                <SidebarMenu className="gap-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          tooltip={item.label}
                          isActive={item.active}
                          aria-label={item.label}
                          aria-current={item.active ? "page" : undefined}
                          onClick={closeMobile}
                          className="home-nav-item group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
                        >
                          <Icon aria-hidden="true" stroke={1.7} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="mt-auto px-3 py-3 group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent>
              <ThemeSelector />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      ) : videoDetails ? (
        <SidebarContent className="group-data-[collapsible=icon]:hidden">
          <SidebarGroup className="px-0 pt-0 pb-3">
            <SidebarGroupContent>
              <div className="px-4">
                <div className="relative grid aspect-video place-items-center overflow-hidden rounded-lg border bg-muted">
                  {videoDetails.thumbnailUrl ? (
                    <Image
                      src={videoDetails.thumbnailUrl}
                      alt=""
                      fill
                      loading="eager"
                      sizes="18rem"
                      className="object-cover"
                    />
                  ) : (
                    <IconVideo aria-hidden="true" stroke={1.7} />
                  )}
                  {videoDetails.duration ? (
                    <span className="absolute right-2 bottom-2 rounded-sm bg-foreground px-1.5 py-1 text-xs font-semibold leading-none text-background">
                      {videoDetails.duration}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 min-w-0 px-4">
                  <p className="text-sm font-semibold">Seu vídeo</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {videoDetails.title}
                  </p>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="px-2 py-2">
            <SidebarGroupContent>
              <nav aria-label="Edição do vídeo">
                <SidebarMenu className="gap-1">
                  {editorNavigation.map((item) => {
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={item.id === activeEditorSection}
                          aria-label={item.label}
                          onClick={() => {
                            if (item.id) setActiveEditorSection(item.id);
                            closeMobile();
                          }}
                          className="h-12 rounded-xl px-4 text-sm font-medium"
                        >
                          <Icon aria-hidden="true" stroke={1.7} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </nav>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      ) : (
        <SidebarContent />
      )}
      <SidebarFooter className="px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu name={name} rca={rca} isStudioAdmin placement="sidebar" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
