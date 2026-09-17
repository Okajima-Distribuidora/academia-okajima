"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconKey } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { type z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

  async function onSubmit(values: PasswordChangeInput) {
    try {
      await apiRequest("/api/auth/password", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      toast.add({
        title: "Senha atualizada",
        description: "Sua nova senha já pode ser usada nos próximos acessos.",
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
        <PasswordField form={form} label="Nova senha" name="password" />
        <PasswordField
          form={form}
          label="Confirme a nova senha"
          name="passwordConfirmation"
        />
        <Button disabled={form.formState.isSubmitting} type="submit">
          {form.formState.isSubmitting ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconKey aria-hidden="true" data-icon="inline-start" />
          )}
          Salvar nova senha
        </Button>
      </FieldGroup>
    </form>
  );
}

function PasswordField({
  form,
  label,
  name,
}: {
  form: ReturnType<typeof useForm<PasswordChangeInput>>;
  label: string;
  name: "password" | "passwordConfirmation";
}) {
  const error = form.formState.errors[name];
  const id = `force-password-change-${name}`;
  return (
    <Field
      data-invalid={Boolean(error)}
      data-disabled={form.formState.isSubmitting}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        autoComplete="new-password"
        id={id}
        type="password"
        {...form.register(name)}
      />
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}
