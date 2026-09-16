"use client";

import { IconLogout, IconSelector, IconShieldLock } from "@tabler/icons-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Settings } from "lucide-react";

type UserMenuPlacement = "topbar" | "sidebar";

export function UserMenu({
  name,
  rca,
  isStudioAdmin,
  placement = "topbar",
}: {
  name: string;
  rca: string;
  isStudioAdmin: boolean;
  placement?: UserMenuPlacement;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const sidebar = placement === "sidebar";
  const initials =
    Array.from((name.trim() || rca.trim()).replace(/\s+/g, ""))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US";

  function logout() {
    setError(false);
    startTransition(async () => {
      try {
        await signOut({ redirect: false, redirectTo: "/login" });
        window.location.replace("/login");
      } catch {
        setError(true);
      }
    });
  }

  // A popover accommodates both account actions and a keyboard-accessible theme control.
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          sidebar ? (
            <SidebarMenuButton
              size="lg"
              className="home-user-menu-trigger group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:p-0!"
            />
          ) : (
            <Button
              variant="ghost"
              size="icon-lg"
              className="home-topbar-icon h-11 w-auto gap-1 rounded-full px-1.5"
            />
          )
        }
        aria-label="Abrir menu do usuário"
      >
        <Avatar aria-hidden="true">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        {sidebar ? (
          <span className="home-user-menu-copy">
            <span className="uppercase" title={name}>
              {name}
            </span>
            <span title={rca}>RCA: {rca}</span>
          </span>
        ) : null}
        {sidebar ? (
          <IconSelector
            className="home-user-menu-selector"
            aria-hidden="true"
            stroke={2}
          />
        ) : null}
      </PopoverTrigger>
      <PopoverContent
        align={sidebar ? "start" : "end"}
        side={sidebar ? "right" : "bottom"}
        sideOffset={10}
        className="w-72 max-w-[calc(100vw-2rem)] gap-0 p-2"
      >
        <PopoverTitle className="sr-only">Sua conta</PopoverTitle>
        <div className="flex items-center gap-3 px-2 py-3">
          <Avatar size="lg" aria-hidden="true">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <p
              className="truncate text-sm font-semibold uppercase"
              title={name}
            >
              {name}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={rca}>
              RCA: {rca}
            </p>
          </div>
        </div>
        <Separator className="my-1" />
        {isStudioAdmin ? (
          <>
            <Button
              variant="ghost"
              className="min-h-11 w-full justify-start gap-3 px-3"
              nativeButton={false}
              render={<Link href="/admin/usuarios" />}
              onClick={() => setOpen(false)}
            >
              <Settings data-icon="inline-start" aria-hidden="true" />
              Painel administrativo
            </Button>
            <Separator className="my-1" />
          </>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 w-full justify-start gap-3 px-3"
          disabled={pending}
          onClick={logout}
        >
          <IconLogout data-icon="inline-start" aria-hidden="true" />
          {pending ? "Saindo…" : "Sair"}
        </Button>
        {error ? (
          <p role="alert" className="px-3 py-2 text-sm text-destructive">
            Não foi possível sair. Tente novamente.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
