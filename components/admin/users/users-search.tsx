"use client";

import { IconSearch } from "@tabler/icons-react";
import { AutoComplete, Input } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

export function UsersSearch({ search }: { search: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(search);
  const [results, setResults] = useState<
    Array<{ id: number; username: string }>
  >([]);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(false);

  useEffect(() => {
    setValue(search);
    setResults([]);
    setSuggestionsEnabled(false);
  }, [search]);

  useEffect(() => {
    const normalizedSearch = value.trim().slice(0, 120);
    if (!suggestionsEnabled || normalizedSearch.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(normalizedSearch)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = (await response.json()) as {
          results?: Array<{ id: number; username: string }>;
        };
        setResults(Array.isArray(data.results) ? data.results.slice(0, 7) : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [suggestionsEnabled, value]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const normalizedSearch = value.trim().slice(0, 120);
    params.delete("pagina");

    if (normalizedSearch) {
      params.set("busca", normalizedSearch);
    } else {
      params.delete("busca");
    }

    const query = params.toString();
    setResults([]);
    setSuggestionsEnabled(false);
    router.push(query ? `/admin/usuarios?${query}` : "/admin/usuarios");
  }

  function selectUsername(username: string) {
    setValue(username);
    setResults([]);
    setSuggestionsEnabled(false);

    const params = new URLSearchParams(searchParams.toString());
    params.set("busca", username);
    params.delete("pagina");
    router.push(`/admin/usuarios?${params.toString()}`);
  }

  return (
    <form
      role="search"
      aria-label="Pesquisar usuários"
      className="w-full sm:w-80"
      onSubmit={handleSubmit}
    >
      <FieldGroup>
        <Field>
          <FieldLabel className="sr-only" htmlFor="users-search">
            Pesquisar por nome
          </FieldLabel>
          <AutoComplete
            className="w-full"
            classNames={{ popup: { root: "admin-users-search-popup" } }}
            filterOption={false}
            notFoundContent={null}
            options={results.map((result) => ({
              label: result.username,
              value: String(result.id),
            }))}
            popupMatchSelectWidth
            value={value}
            onSearch={(nextValue) => {
              setValue(nextValue);
              setSuggestionsEnabled(true);
            }}
            onSelect={(id) => {
              const selectedUser = results.find(
                (result) => String(result.id) === id,
              );

              if (selectedUser) selectUsername(selectedUser.username);
            }}
          >
            <Input
              id="users-search"
              name="busca"
              type="search"
              placeholder="Pesquisar por nome"
              maxLength={120}
              suffix={<IconSearch aria-hidden="true" />}
            />
          </AutoComplete>
        </Field>
      </FieldGroup>
    </form>
  );
}
