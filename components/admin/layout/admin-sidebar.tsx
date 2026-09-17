"use client";

import { IconUser } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/home/user-menu";
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

export function AdminSidebar({ name, rca }: { name: string; rca: string }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isUsersSection =
    pathname === "/admin/usuarios" || pathname.startsWith("/admin/usuarios/");

  function closeMobileSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon" className="home-sidebar-panel">
      <SidebarHeader className="md:hidden">
        <div className="flex h-12 items-center justify-between gap-2 px-2">
          <Brand />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="px-3 pt-5 pb-3">
          <SidebarGroupContent>
            <nav aria-label="Painel administrativo">
              <SidebarMenu className="gap-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/admin/usuarios" />}
                    tooltip="Usuários"
                    isActive={isUsersSection}
                    aria-current={isUsersSection ? "page" : undefined}
                    onClick={closeMobileSidebar}
                    className="home-nav-item group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
                  >
                    <IconUser aria-hidden="true" stroke={1.7} />
                    <span>Usuários</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
