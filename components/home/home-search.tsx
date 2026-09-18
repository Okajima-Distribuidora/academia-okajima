"use client";

import { IconSearch } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent, Ref } from "react";
import { useEffect, useState } from "react";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { normalizeHomeSearch } from "@/lib/home/navigation";

interface HomeSearchResult {
  id: number;
  title: string;
  href: string;
  thumbnailUrl: string | null;
}

function SearchResultOption({ result }: { result: HomeSearchResult }) {
  return (
    <a href={result.href} className="home-search-option">
      <span className="home-search-option-thumbnail">
        {result.thumbnailUrl ? (
          <Image
            src={result.thumbnailUrl}
            alt=""
            width={72}
            height={40}
            loading="eager"
            className="home-search-option-image"
          />
        ) : (
          <IconSearch aria-hidden="true" stroke={1.7} />
        )}
      </span>
      <span className="home-search-option-title">{result.title}</span>
    </a>
  );
}

export function HomeSearch({
  inputRef,
  onNavigate,
}: {
  inputRef?: Ref<HTMLInputElement>;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const query = normalizeHomeSearch(params.get("q"));
  const [value, setValue] = useState(query);
  const [results, setResults] = useState<HomeSearchResult[]>([]);
  const normalizedValue = normalizeHomeSearch(value);

  useEffect(() => {
    if (normalizedValue.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/home/search?q=${encodeURIComponent(normalizedValue)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = (await response.json()) as {
          results?: HomeSearchResult[];
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
  }, [normalizedValue]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuery = normalizeHomeSearch(value);
    if (!submittedQuery) return;

    onNavigate?.();
    router.push(`/?q=${encodeURIComponent(submittedQuery)}`);
  }

  function handleSearchChange(nextValue: string) {
    setValue(nextValue);
    setResults([]);
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Pesquisar na academia"
      className="w-full min-w-0"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="home-search" className="sr-only">
            Pesquisar vídeos
          </FieldLabel>
          <InputGroup className="home-search">
            <InputGroupInput
              ref={inputRef}
              id="home-search"
              type="text"
              name="q"
              placeholder="Pesquisar vídeos"
              value={value}
              onChange={(event) => handleSearchChange(event.target.value)}
              maxLength={120}
              autoComplete="off"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                variant="secondary"
                size="icon-sm"
                aria-label="Pesquisar"
              >
                <IconSearch aria-hidden="true" stroke={1.7} />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {results.length > 0 ? (
            <div className="home-search-results" aria-live="polite">
              {results.slice(0, 7).map((result) => (
                <SearchResultOption key={result.id} result={result} />
              ))}
            </div>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
