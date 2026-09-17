"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

const pageSizes = [20, 30, 40, 50] as const;

export function UsersPageSizeSelect({
  pageSize,
  search,
}: {
  pageSize: number;
  search: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Field orientation="horizontal" className="w-auto shrink-0 gap-2">
      <FieldLabel
        className="flex-none whitespace-nowrap"
        htmlFor="users-page-size"
      >
        Por página
      </FieldLabel>
      <NativeSelect
        id="users-page-size"
        size="sm"
        value={String(pageSize)}
        aria-label="Usuários por página"
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("quantidade", event.target.value);
          params.delete("pagina");
          router.push(`/admin/usuarios?${params.toString()}`);
        }}
      >
        {pageSizes.map((size) => (
          <NativeSelectOption key={size} value={size}>
            {size}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}
