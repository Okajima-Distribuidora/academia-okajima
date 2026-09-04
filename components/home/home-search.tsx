"use client";

import type { Ref } from "react";
import { useSearchParams } from "next/navigation";
import { IconSearch } from "@tabler/icons-react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { normalizeHomeSearch } from "@/lib/home/navigation";

export function HomeSearch({ inputRef }: { inputRef?: Ref<HTMLInputElement> }) {
  const params = useSearchParams();
  const query = normalizeHomeSearch(params.get("q"));
  return <form action="/" method="get" role="search" aria-label="Pesquisar na academia" className="w-full min-w-0">
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="home-search" className="sr-only">Pesquisar vídeos</FieldLabel>
        <InputGroup className="home-search">
          <InputGroupInput ref={inputRef} key={query} id="home-search" type="search" name="q" placeholder="Pesquisar"
            defaultValue={query} maxLength={120} autoComplete="off" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit" variant="secondary" size="icon-sm" aria-label="Pesquisar">
              <IconSearch aria-hidden="true" stroke={1.7} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </FieldGroup>
  </form>;
}
