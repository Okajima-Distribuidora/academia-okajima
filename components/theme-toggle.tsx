"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useAcademiaTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { mounted, resolvedTheme, setTheme } = useAcademiaTheme();
  const dark = mounted && resolvedTheme === "dark";
  const label = dark ? "Ativar tema claro" : "Ativar tema escuro";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className="size-11"
      aria-label={label}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  );
}
