"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRememberedIdentifier } from "@/components/auth/use-remembered-identifier";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { credentialsSchema } from "@/lib/auth/validation";

const INVALID = "RCA/e-mail ou senha inválidos, ou conta indisponível.";
const UNAVAILABLE =
  "Não foi possível entrar agora. Tente novamente em instantes.";

export function LoginForm() {
  const {
    identifier,
    remember,
    changeIdentifier,
    changeRemember,
    persistIdentifier,
  } = useRememberedIdentifier();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});
  const [pending, startTransition] = useTransition();
  const submitting = useRef(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    setFieldErrors({});
    const values = new FormData(event.currentTarget);
    const parsed = credentialsSchema.safeParse({
      identifier: values.get("identifier"),
      password: values.get("password"),
    });
    if (!parsed.success) {
      const errors: { identifier?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "identifier" || field === "password")
          errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      (errors.identifier ? identifierRef : passwordRef).current?.focus();
      return;
    }
    // Also capture browser autofill when it did not dispatch an input event.
    persistIdentifier(parsed.data.identifier);
    submitting.current = true;
    startTransition(async () => {
      let navigating = false;
      try {
        const result = await signIn("credentials", {
          ...parsed.data,
          redirect: false,
          redirectTo: "/",
        });
        if (result?.ok && !result.error) {
          // Fixed destination and full navigation discard any cached authenticated UI.
          navigating = true;
          window.location.replace("/");
          return;
        }
        setError(
          result?.code === "rate_limited"
            ? "Muitas tentativas. Aguarde até 15 minutos antes de tentar novamente."
            : result?.error === "CredentialsSignin" &&
                result.code !== "unavailable"
              ? INVALID
              : UNAVAILABLE,
        );
      } catch {
        setError(UNAVAILABLE);
      } finally {
        if (!navigating) {
          submitting.current = false;
          if (passwordRef.current) passwordRef.current.value = "";
          passwordRef.current?.focus();
        }
      }
    });
  }

  return (
    <form
      method="post"
      action="/login"
      noValidate
      onSubmit={submit}
      aria-label="Entrar na Academia"
      aria-busy={pending}
    >
      <FieldGroup className="gap-6">
        <Field data-invalid={!!fieldErrors.identifier} data-disabled={pending}>
          <FieldLabel htmlFor="identifier">RCA ou e-mail</FieldLabel>
          <Input
            ref={identifierRef}
            id="identifier"
            name="identifier"
            type="text"
            required
            value={identifier}
            onChange={(event) => changeIdentifier(event.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={255}
            readOnly={pending}
            className="h-12"
            aria-invalid={!!fieldErrors.identifier}
            aria-describedby={
              fieldErrors.identifier ? "identifier-error" : undefined
            }
          />
          {fieldErrors.identifier ? (
            <FieldError id="identifier-error">
              {fieldErrors.identifier}
            </FieldError>
          ) : null}
        </Field>
        <Field data-invalid={!!fieldErrors.password} data-disabled={pending}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <InputGroup className="h-12">
            <InputGroupInput
              ref={passwordRef}
              id="password"
              name="password"
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              maxLength={1024}
              readOnly={pending}
              className="h-full"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={
                fieldErrors.password ? "password-error" : undefined
              }
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-sm"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                disabled={pending}
              >
                {showPassword ? (
                  <EyeOffIcon aria-hidden="true" />
                ) : (
                  <EyeIcon aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {fieldErrors.password ? (
            <FieldError id="password-error">{fieldErrors.password}</FieldError>
          ) : null}
        </Field>
        <Field orientation="horizontal" data-disabled={pending}>
          <Checkbox
            id="remember-identifier"
            nativeButton
            render={<button type="button" />}
            checked={remember}
            onCheckedChange={changeRemember}
            disabled={pending}
          />
          <FieldLabel htmlFor="remember-identifier">
            Lembre-se de mim
          </FieldLabel>
        </Field>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full"
          disabled={pending}
        >
          {pending ? (
            <Spinner aria-label="Entrando" data-icon="inline-start" />
          ) : null}
          {pending ? "Entrando…" : "Entrar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
