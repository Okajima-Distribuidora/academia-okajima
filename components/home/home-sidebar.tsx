"use client";

import {
  IconBooks,
  IconCategory,
  IconChevronDown,
  IconDeviceMobile,
  IconHelpCircle,
  IconHome,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Brand } from "@/components/brand";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { HomeCategoryNavigation } from "@/lib/home/catalog";
import {
  categoryHref,
  getHomeSection,
  homeSectionHref,
  homeSections,
  normalizeHomeSearch,
} from "@/lib/home/navigation";
import { UserMenu } from "./user-menu";

const navigation = homeSections.map((section, index) => ({
  ...section,
  icon: [IconHome, null, IconDeviceMobile, IconBooks, IconHelpCircle][index],
}));

export function HomeSidebar({
  name,
  rca,
  categories,
  isStudioAdmin,
}: {
  name: string;
  rca: string;
  categories: HomeCategoryNavigation[];
  isStudioAdmin: boolean;
}) {
  const params = useSearchParams();
  const pathname = usePathname();
  const active = getHomeSection(params.get("secao"));
  const searching = !!normalizeHomeSearch(params.get("q"));
  const { isMobile, setOpenMobile } = useSidebar();

  function closeMobileSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  function item(section: (typeof navigation)[number]) {
    if (section.id === "categoria") {
      return categories.map((category) => {
        const href = categoryHref(category);
        const selected = !searching && pathname === href;

        return (
          <SidebarMenuItem key={category.id}>
            <Collapsible defaultOpen={selected}>
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    isActive={selected}
                    aria-label={`Alternar subcategorias de ${category.label}`}
                    className="home-nav-item group/category-toggle group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
                  />
                }
              >
                <IconCategory aria-hidden="true" stroke={1.7} />
                <span>{category.label}</span>
                <IconChevronDown
                  data-icon="inline-end"
                  aria-hidden="true"
                  className="ml-auto transition-transform group-data-[panel-open]/category-toggle:rotate-180"
                />
              </CollapsibleTrigger>
              {category.subcategories.length > 0 ? (
                <CollapsibleContent>
                  <SidebarMenuSub
                    aria-label={`Subcategorias de ${category.label}`}
                  >
                    {category.subcategories.map((subcategory) => (
                      <SidebarMenuSubItem key={subcategory.id}>
                        <SidebarMenuSubButton
                          render={<Link href={href} />}
                          onClick={closeMobileSidebar}
                        >
                          <span>{subcategory.label}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              ) : null}
            </Collapsible>
          </SidebarMenuItem>
        );
      });
    }

    const Icon = section.icon;
    const selected = !searching && pathname === "/" && active.id === section.id;
    return (
      <SidebarMenuItem key={section.id}>
        <SidebarMenuButton
          render={<Link href={homeSectionHref(section.id)} />}
          tooltip={section.label}
          isActive={selected}
          aria-label={section.label}
          aria-current={selected ? "page" : undefined}
          onClick={closeMobileSidebar}
          className="home-nav-item group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
        >
          {Icon ? <Icon aria-hidden="true" stroke={1.7} /> : null}
          <span>{section.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Sidebar collapsible="icon" className="home-sidebar-panel">
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
      <SidebarContent>
        <SidebarGroup className="px-3 pt-5 pb-3">
          <SidebarGroupContent>
            <nav aria-label="Conteúdos da academia">
              <SidebarMenu className="gap-1">
                {navigation.map(item)}
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
            <UserMenu
              name={name}
              rca={rca}
              isStudioAdmin={isStudioAdmin}
              placement="sidebar"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
