"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconDeviceFloppy, IconPencil, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { toast } from "@/components/ui/toast";
import {
  type AdminUserUpdateInput,
  adminUserUpdateSchema,
} from "@/lib/admin/users/validation";

type EditableUser = AdminUserUpdateInput & {
  id: number;
};

export function UserDetailsForm({ user }: { user: EditableUser }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const form = useForm<AdminUserUpdateInput>({
    defaultValues: user,
    resolver: zodResolver(adminUserUpdateSchema),
  });

  async function onSubmit(values: AdminUserUpdateInput) {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const data = (await response.json().catch(() => null)) as {
      issues?: Partial<Record<keyof AdminUserUpdateInput, string[]>>;
      message?: string;
    } | null;

    if (!response.ok) {
      for (const [field, messages] of Object.entries(data?.issues ?? {})) {
        const message = messages?.[0];
        if (message) {
          form.setError(field as keyof AdminUserUpdateInput, { message });
        }
      }

      toast.add({
        title: "Não foi possível salvar",
        description: data?.message ?? "Tente novamente.",
        type: "error",
      });
      return;
    }

    form.reset(values);
    toast.add({
      title: "Dados atualizados",
      description: "As alterações do usuário foram salvas.",
      type: "success",
    });
    setIsEditing(false);
    router.refresh();
  }

  function startEditing() {
    form.reset(user);
    setIsEditing(true);
  }

  function cancelEditing() {
    form.reset(user);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ReadOnlyField label="Nome de usuário" value={user.username} />
          <ReadOnlyField label="Nome" value={user.firstName} />
          <ReadOnlyField label="Sobrenome" value={user.lastName} />
          <ReadOnlyField label="RCA" value={user.rca} />
          <ReadOnlyField label="E-mail" value={user.email} />
          <ReadOnlyField
            label="Status"
            value={
              <Badge variant={user.isActive ? "success" : "destructive"}>
                {user.isActive ? "Ativo" : "Inativo"}
              </Badge>
            }
          />
          <ReadOnlyField
            label="Permissão"
            value={
              <Badge variant={user.isAdmin ? "default" : "secondary"}>
                {user.isAdmin ? "Administrador" : "Usuário"}
              </Badge>
            }
          />
        </dl>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={startEditing}>
            <IconPencil data-icon="inline-start" aria-hidden="true" />
            Editar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <TextField form={form} label="Nome de usuário" name="username" />
        <TextField form={form} label="Nome" name="firstName" />
        <TextField form={form} label="Sobrenome" name="lastName" />
        <TextField form={form} label="RCA" name="rca" />
        <TextField form={form} label="E-mail" name="email" type="email" />
        <SelectField
          form={form}
          label="Status"
          name="isActive"
          options={[
            { label: "Ativo", value: true },
            { label: "Inativo", value: false },
          ]}
        />
        <SelectField
          form={form}
          label="Permissão"
          name="isAdmin"
          options={[
            { label: "Administrador", value: true },
            { label: "Usuário", value: false },
          ]}
        />
      </FieldGroup>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={cancelEditing}>
          <IconX data-icon="inline-start" aria-hidden="true" />
          Descartar
        </Button>
        <Button
          disabled={!form.formState.isDirty || form.formState.isSubmitting}
          type="submit"
        >
          <IconDeviceFloppy data-icon="inline-start" aria-hidden="true" />
          {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value || "Não informado"}</dd>
    </div>
  );
}

function TextField({
  form,
  label,
  name,
  type = "text",
}: {
  form: ReturnType<typeof useForm<AdminUserUpdateInput>>;
  label: string;
  name: keyof Pick<
    AdminUserUpdateInput,
    "username" | "firstName" | "lastName" | "rca" | "email"
  >;
  type?: "email" | "text";
}) {
  const error = form.formState.errors[name];
  const id = `admin-user-${name}`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        aria-invalid={Boolean(error)}
        id={id}
        type={type}
        {...form.register(name)}
      />
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

function SelectField({
  form,
  label,
  name,
  options,
}: {
  form: ReturnType<typeof useForm<AdminUserUpdateInput>>;
  label: string;
  name: "isActive" | "isAdmin";
  options: Array<{ label: string; value: boolean }>;
}) {
  const error = form.formState.errors[name];
  const id = `admin-user-${name}`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <NativeSelect
            aria-invalid={Boolean(error)}
            id={id}
            value={field.value ? "true" : "false"}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value === "true")}
          >
            {options.map((option) => (
              <NativeSelectOption
                key={String(option.value)}
                value={String(option.value)}
              >
                {option.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      />
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}
