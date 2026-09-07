"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  IconBrandSupabase ,
  IconFile,
  IconFlame,
  IconHelpCircle,
  IconHome,
  IconVideo,
  IconX,
  IconChartBarPopular
} from "@tabler/icons-react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { getHomeSection, homeSectionHref, homeSections, normalizeHomeSearch } from "@/lib/home/navigation";

const navigation = homeSections.map((section, index) => ({
  ...section,
  icon: [IconHome, IconVideo, IconFlame, IconChartBarPopular , IconBrandSupabase , IconFile, IconHelpCircle][index],
}));

export function HomeSidebar() {
  const params = useSearchParams();
  const pathname = usePathname();
  const active = getHomeSection(params.get("secao"));
  const searching = !!normalizeHomeSearch(params.get("q"));
  const { isMobile, setOpenMobile } = useSidebar();

  function item(section: (typeof navigation)[number]) {
    const Icon = section.icon;
    const selected = pathname === "/" && !searching && active.id === section.id;
    return <SidebarMenuItem key={section.id}>
      <SidebarMenuButton
        render={<Link href={homeSectionHref(section.id)} />}
        tooltip={section.label}
        isActive={selected}
        aria-label={section.label}
        aria-current={selected ? "page" : undefined}
        onClick={() => { if (isMobile) setOpenMobile(false); }}
        className="home-nav-item group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
      >
        <Icon aria-hidden="true" stroke={1.7} />
        <span>{section.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>;
  }

  return <Sidebar collapsible="icon" className="home-sidebar-panel">
    <SidebarHeader className="md:hidden">
      <div className="flex h-12 items-center justify-between gap-2 px-2">
        <Brand />
        <Button variant="ghost" size="icon-lg" className="size-11" aria-label="Fechar menu lateral"
          onClick={() => setOpenMobile(false)}>
          <IconX aria-hidden="true" />
        </Button>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup className="px-3 pt-5 pb-3">
        <SidebarGroupContent>
          <nav aria-label="Conteúdos da academia">
            <SidebarMenu className="gap-1">{navigation.slice(0, 5).map(item)}</SidebarMenu>
          </nav>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      <SidebarGroup className="px-3 py-3">
        <SidebarGroupContent>
          <nav aria-label="Materiais da academia">
            <SidebarMenu>{item(navigation[5])}</SidebarMenu>
          </nav>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarSeparator className="data-horizontal:w-auto" />
    <SidebarFooter className="px-3 py-4">
      <nav aria-label="Suporte">
        <SidebarMenu>{item(navigation[6])}</SidebarMenu>
      </nav>
      <p className="px-2 pt-2 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
        Copyright © 2025 - Academia Okajima. Todos os direitos reservados.
      </p>
    </SidebarFooter>
  </Sidebar>;
}
