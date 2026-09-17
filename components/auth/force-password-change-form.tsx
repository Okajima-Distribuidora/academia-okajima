"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { passwordChangeSchema } from "@/lib/auth/validation";
import { apiRequest } from "@/lib/query/http";

type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export function ForcePasswordChangeForm() {
  const router = useRouter();
  const form = useForm<PasswordChangeInput>({
    defaultValues: { password: "", passwordConfirmation: "" },
    resolver: zodResolver(passwordChangeSchema),
  });
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    passwordConfirmation: false,
  });

  async function onSubmit(values: PasswordChangeInput) {
    try {
      await apiRequest("/api/auth/password", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      toast.add({
        title: "Senha atualizada",
        description: "Sua nova senha já foi redefinida.",
        type: "success",
      });
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.add({
        title: "Não foi possível atualizar a senha",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        type: "error",
      });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <PasswordField
          form={form}
          label="Nova senha"
          name="password"
          visible={visiblePasswords.password}
          onToggleVisibility={() =>
            setVisiblePasswords((current) => ({
              ...current,
              password: !current.password,
            }))
          }
        />
        <PasswordField
          form={form}
          label="Confirme a nova senha"
          name="passwordConfirmation"
          visible={visiblePasswords.passwordConfirmation}
          onToggleVisibility={() =>
            setVisiblePasswords((current) => ({
              ...current,
              passwordConfirmation: !current.passwordConfirmation,
            }))
          }
        />
        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting && <Spinner data-icon="inline-start" />}
          Redefinir senha
        </Button>
      </FieldGroup>
    </form>
  );
}

function PasswordField({
  form,
  label,
  name,
  onToggleVisibility,
  visible,
}: {
  form: ReturnType<typeof useForm<PasswordChangeInput>>;
  label: string;
  name: "password" | "passwordConfirmation";
  onToggleVisibility: () => void;
  visible: boolean;
}) {
  const error = form.formState.errors[name];
  const id = `force-password-change-${name}`;
  return (
    <Field
      data-invalid={Boolean(error)}
      data-disabled={form.formState.isSubmitting}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          aria-invalid={Boolean(error)}
          autoComplete="new-password"
          id={id}
          type={visible ? "text" : "password"}
          {...form.register(name)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            size="icon-sm"
            type="button"
            onClick={onToggleVisibility}
          >
            {visible ? (
              <IconEyeOff aria-hidden="true" />
            ) : (
              <IconEye aria-hidden="true" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}
