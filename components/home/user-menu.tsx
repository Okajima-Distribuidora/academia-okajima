"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { IconCaretDownFilled, IconSettings, IconLogout } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/theme-selector";
import { Separator } from "@/components/ui/separator";
import {
  Popover, PopoverTrigger, PopoverContent, PopoverTitle,
} from "@/components/ui/popover";

export function UserMenu({ name, rca }: { name: string; rca: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const nameParts = (name.trim() || rca.trim()).split(/\s+/);
  const initials = [nameParts[0], nameParts.length > 1 ? nameParts.at(-1) : undefined]
    .map((part) => Array.from(part ?? "")[0] ?? "").join("").toUpperCase() || "U";

  function logout() {
    setError(false);
    startTransition(async () => {
      try {
        await signOut({ redirect: false, redirectTo: "/login" });
        window.location.replace("/login");
      } catch { setError(true); }
    });
  }

  // A popover accommodates both account actions and a keyboard-accessible theme control.
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Button variant="ghost" size="icon-lg" className="home-topbar-icon h-11 w-auto gap-1 rounded-full px-1.5" />}
      aria-label="Abrir menu do usuário">
      <Avatar aria-hidden="true">
        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <IconCaretDownFilled
        aria-hidden="true"
        data-icon="inline-end"
        className="transition-transform duration-150 group-aria-expanded/button:rotate-180 motion-reduce:transition-none"
      />
    </PopoverTrigger>
    <PopoverContent align="end" sideOffset={10} className="w-72 max-w-[calc(100vw-2rem)] gap-0 p-2">
      <PopoverTitle className="sr-only">Sua conta</PopoverTitle>
      <div className="flex items-center gap-3 px-2 py-3">
        <Avatar size="lg" aria-hidden="true">
          <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-sm font-semibold" title={name}>{name}</p>
          <p className="truncate text-xs text-muted-foreground" title={rca}>RCA: {rca}</p>
        </div>
      </div>
      <Separator className="my-1" />
      <Button type="button" variant="ghost" disabled className="min-h-11 w-full justify-start gap-3 px-3">
        <IconSettings data-icon="inline-start" aria-hidden="true" />
        Configurações
        <span className="ml-auto text-xs">Em breve</span>
      </Button>
      <ThemeSelector />
      <Separator className="my-1" />
      <Button type="button" variant="ghost" className="min-h-11 w-full justify-start gap-3 px-3" disabled={pending} onClick={logout}>
        <IconLogout data-icon="inline-start" aria-hidden="true" />
        {pending ? "Saindo…" : "Sair"}
      </Button>
      {error ? <p role="alert" className="px-3 py-2 text-sm text-destructive">Não foi possível sair. Tente novamente.</p> : null}
    </PopoverContent>
  </Popover>;
}
