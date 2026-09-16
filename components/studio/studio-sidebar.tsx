"use client";

import Link from "next/link";
import { IconLayoutDashboard, IconX } from "@tabler/icons-react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function StudioSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();

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
          <nav aria-label="Academia Studio">
            <SidebarMenu className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/studio" />}
                  tooltip="Painel"
                  isActive
                  aria-label="Painel"
                  aria-current="page"
                  onClick={() => { if (isMobile) setOpenMobile(false); }}
                  className="home-nav-item group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
                >
                  <IconLayoutDashboard aria-hidden="true" stroke={1.7} />
                  <span>Painel</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </nav>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>;
}
