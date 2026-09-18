"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useId } from "react";

import { isAcademiaTheme, useAcademiaTheme } from "@/components/theme-provider";
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Claro", icon: IconSun },
  { value: "dark", label: "Escuro", icon: IconMoon },
  { value: "system", label: "Sistema", icon: IconDeviceDesktop },
] as const;

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const labelId = useId();
  const { mounted, theme, setTheme } = useAcademiaTheme();
  const selectedTheme = mounted ? theme : "system";
  const selectedOption =
    themeOptions.find((option) => option.value === selectedTheme) ??
    themeOptions[2];
  const SelectedIcon = selectedOption.icon;

  return (
    <FieldGroup className={cn(compact ? "w-auto px-0 py-0" : "px-3 py-2")}>
      <Field
        orientation="horizontal"
        className={cn(
          compact ? "w-auto justify-end gap-0" : "justify-between gap-4",
        )}
        data-disabled={!mounted || undefined}
      >
        <FieldTitle
          id={labelId}
          className={cn(
            compact ? "sr-only" : "[&_svg]:size-4 [&_svg]:shrink-0",
          )}
        >
          <SelectedIcon aria-hidden="true" />
          Tema
        </FieldTitle>
        <ToggleGroup
          aria-labelledby={labelId}
          spacing={1}
          size="sm"
          data-theme={mounted ? theme : undefined}
          className="theme-selector-control relative isolate shrink-0 rounded-full bg-background p-0.5 ring-1 ring-border/60"
          disabled={!mounted}
          value={[selectedTheme]}
          onValueChange={(values) => {
            const nextTheme = values[0];
            // Keep exactly one selection, including when the active option is clicked again.
            if (isAcademiaTheme(nextTheme)) setTheme(nextTheme);
          }}
        >
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={label}
              title={
                value === "system"
                  ? "Sistema — seguir o tema do dispositivo"
                  : label
              }
              className="relative size-7 min-w-0 rounded-full p-0"
            >
              <Icon aria-hidden="true" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
    </FieldGroup>
  );
}
