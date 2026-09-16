"use client";

import { useId, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon, IconDeviceDesktop } from "@tabler/icons-react";
import { Field, FieldGroup, FieldTitle } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const subscribe = () => () => {};
const themeOptions = [
  { value: "light", label: "Claro", icon: IconSun },
  { value: "dark", label: "Escuro", icon: IconMoon },
  { value: "system", label: "Sistema", icon: IconDeviceDesktop },
] as const;

export function ThemeSelector() {
  const labelId = useId();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { theme, setTheme } = useTheme();
  const selectedOption = themeOptions.find((option) => option.value === theme) ?? themeOptions[2];
  const SelectedIcon = selectedOption.icon;

  return <FieldGroup className="px-3 py-2">
    <Field orientation="horizontal" className="justify-between gap-4" data-disabled={!mounted || undefined}>
      <FieldTitle id={labelId} className="[&_svg]:size-4 [&_svg]:shrink-0">
        <SelectedIcon aria-hidden="true" />
        Tema
      </FieldTitle>
      <ToggleGroup
        aria-labelledby={labelId}
        spacing={1}
        size="sm"
        data-theme={mounted ? theme : undefined}
        className="theme-selector-control relative isolate shrink-0 rounded-full bg-background p-0.5 shadow-sm ring-1 ring-border/60"
        disabled={!mounted}
        value={mounted && theme ? [theme] : []}
        onValueChange={(values) => {
          const nextTheme = values[0];
          // Keep exactly one selection, including when the active option is clicked again.
          if (themeOptions.some((option) => option.value === nextTheme)) setTheme(nextTheme);
        }}
      >
        {themeOptions.map(({ value, label, icon: Icon }) => <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          title={value === "system" ? "Sistema — seguir o tema do dispositivo" : label}
          className="relative size-7 min-w-0 rounded-full p-0"
        >
          <Icon aria-hidden="true" />
        </ToggleGroupItem>)}
      </ToggleGroup>
    </Field>
  </FieldGroup>;
}
