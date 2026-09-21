"use client";

import {
  IconArrowBadgeRight,
  IconBooks,
  IconCategory,
  IconChevronDown,
  IconDeviceMobile,
  IconHome,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  categorySubcategoryHref,
  getHomeSection,
  homeSectionHref,
  homeSections,
  normalizeHomeSearch,
} from "@/lib/home/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";

const navigation = homeSections.map((section, index) => ({
  ...section,
  icon: [IconHome, null, IconDeviceMobile, IconBooks][index],
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
  const { isMobile, setOpen, setOpenMobile } = useSidebar();
  const currentCategory = categories.find(
    (category) => !searching && pathname === categoryHref(category),
  );
  const selectedCategoryId = currentCategory?.id;
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(
    () => new Set(selectedCategoryId ? [selectedCategoryId] : []),
  );
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!selectedCategoryId) return;

    setOpenCategoryIds((currentIds) => {
      if (currentIds.has(selectedCategoryId)) return currentIds;
      return new Set([...currentIds, selectedCategoryId]);
    });
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!currentCategory) {
      setActiveSubcategoryId(null);
      return;
    }

    let frame: number | null = null;
    let observer: MutationObserver | null = null;
    const activeOffset = 112;

    const syncActiveSubcategory = () => {
      frame = null;
      const headings = currentCategory.subcategories.flatMap((subcategory) => {
        const heading = document.getElementById(
          `category-subcategory-${subcategory.id}-title`,
        );
        return heading ? [{ id: subcategory.id, heading }] : [];
      });

      if (headings.length === 0) {
        setActiveSubcategoryId(null);
        return;
      }

      observer?.disconnect();
      let activeHeading = headings[0];
      for (const heading of headings) {
        if (heading.heading.getBoundingClientRect().top <= activeOffset) {
          activeHeading = heading;
        }
      }

      const isAtPageEnd =
        document.documentElement.scrollHeight -
          (window.scrollY + window.innerHeight) <=
        2;
      if (isAtPageEnd) {
        activeHeading = headings[headings.length - 1];
      }

      setActiveSubcategoryId(activeHeading.id);
    };

    const scheduleSync = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(syncActiveSubcategory);
    };

    observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    scheduleSync();

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [currentCategory]);

  function closeMobileSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  function item(section: (typeof navigation)[number]) {
    if (section.id === "categoria") {
      return categories.map((category) => {
        const href = categoryHref(category);
        const isCurrentCategory = !searching && pathname === href;

        return (
          <SidebarMenuItem key={category.id}>
            <Collapsible
              className="group/category"
              open={openCategoryIds.has(category.id)}
              onOpenChange={(open) => {
                if (open && !isMobile) setOpen(true);
                setOpenCategoryIds((currentIds) => {
                  const nextIds = new Set(currentIds);
                  if (open) nextIds.add(category.id);
                  else nextIds.delete(category.id);
                  return nextIds;
                });
              }}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton
                    isActive={isCurrentCategory}
                    tooltip={category.label}
                    aria-label={`Alternar subcategorias de ${category.label}`}
                    className="home-nav-item group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
                  />
                }
              >
                <IconCategory aria-hidden="true" stroke={1.7} />
                <span>{category.label}</span>
                <IconChevronDown
                  aria-hidden="true"
                  className="ml-auto transition-transform group-data-[collapsible=icon]:hidden group-data-open/category:rotate-180"
                />
              </CollapsibleTrigger>
              {category.subcategories.length > 0 ? (
                <CollapsibleContent>
                  <SidebarMenuSub
                    aria-label={`Subcategorias de ${category.label}`}
                  >
                    {category.subcategories.map((subcategory, index) => {
                      const shouldScrollToSubcategory =
                        index > 0 || isCurrentCategory;
                      const isActiveSubcategory =
                        isCurrentCategory &&
                        activeSubcategoryId === subcategory.id;

                      return (
                        <SidebarMenuSubItem key={subcategory.id}>
                          <SidebarMenuSubButton
                            isActive={isActiveSubcategory}
                            className={cn(
                              isActiveSubcategory &&
                                "relative overflow-visible! bg-transparent! text-primary! underline decoration-primary font-semibold underline-offset-4 before:absolute before:-left-5 before:size-6 before:bg-sidebar before:content-[''] hover:bg-transparent! hover:text-primary!",
                            )}
                            render={
                              <Link
                                href={categorySubcategoryHref(
                                  category,
                                  subcategory,
                                  shouldScrollToSubcategory,
                                )}
                                scroll={!isCurrentCategory}
                              />
                            }
                            onClick={() => {
                              closeMobileSidebar();
                            }}
                          >
                            {isActiveSubcategory ? (
                              <IconArrowBadgeRight
                                aria-hidden="true"
                                className="absolute -left-[1.110rem] size-5! text-primary!"
                                stroke={2}
                              />
                            ) : null}
                            <span>{subcategory.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
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
      <SidebarContent data-lenis-prevent>
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
