"use client";

import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="ghost"
        className="h-11"
        disabled={pending}
        onClick={() => {
          setError(false);
          startTransition(async () => {
            try {
              await signOut({ redirect: false, redirectTo: "/login" });
              window.location.replace("/login");
            } catch {
              setError(true);
            }
          });
        }}
      >
        {pending ? (
          <Spinner aria-label="Saindo" data-icon="inline-start" />
        ) : (
          <LogOutIcon aria-hidden="true" data-icon="inline-start" />
        )}
        {pending ? "Saindo…" : "Sair"}
      </Button>
      {error ? (
        <p role="alert" className="max-w-40 text-sm text-destructive">
          Não foi possível sair. Tente novamente.
        </p>
      ) : null}
    </div>
  );
}
