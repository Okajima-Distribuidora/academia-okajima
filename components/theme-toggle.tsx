"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};

export function ThemeToggle() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { resolvedTheme, setTheme } = useTheme();
  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Ativar tema claro" : "Ativar tema escuro";
  return <Button type="button" variant="outline" size="icon-lg" className="size-11"
    aria-label={label} title={label} disabled={!mounted}
    onClick={() => setTheme(dark ? "light" : "dark")}>
    {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
  </Button>;
}
