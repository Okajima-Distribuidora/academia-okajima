"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconDeviceFloppy,
  IconEye,
  IconEyeOff,
  IconKey,
  IconPencil,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "@/components/ui/toast";
import {
  type AdminUserPasswordResetInput,
  type AdminUserUpdateInput,
  adminUserPasswordResetSchema,
  adminUserUpdateSchema,
} from "@/lib/admin/users/validation";
import { generateRandomPassword } from "./utils/password";

type EditableUser = AdminUserUpdateInput & {
  id: number;
};

export function UserDetailsForm({ user }: { user: EditableUser }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
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
        <FieldGroup className="gap-8">
          <FieldSet>
            <FieldLegend>Dados pessoais</FieldLegend>
            <FieldDescription>
              Informações de identificação do usuário.
            </FieldDescription>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ReadOnlyField label="Nome" value={user.firstName} />
              <ReadOnlyField label="Sobrenome" value={user.lastName} />
              <ReadOnlyField
                label="Gênero"
                value={user.gender === "female" ? "Feminino" : "Masculino"}
              />
            </dl>
          </FieldSet>
          <FieldSet>
            <FieldLegend>Dados de acesso</FieldLegend>
            <FieldDescription>
              Identificadores usados para localizar a conta.
            </FieldDescription>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ReadOnlyField label="Nome de usuário" value={user.username} />
              <ReadOnlyField label="RCA" value={user.rca} />
              <ReadOnlyField label="E-mail" value={user.email} />
            </dl>
          </FieldSet>
          <FieldSet>
            <FieldLegend>Acesso e permissões</FieldLegend>
            <FieldDescription>
              Status da conta e nível de acesso administrativo.
            </FieldDescription>
            <dl className="grid gap-5 sm:grid-cols-2">
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
          </FieldSet>
        </FieldGroup>
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
    <div className="flex flex-col gap-8">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup className="gap-8">
          <FieldSet>
            <FieldLegend>Dados pessoais</FieldLegend>
            <FieldDescription>
              Informações de identificação do usuário.
            </FieldDescription>
            <FieldGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <TextField form={form} label="Nome" name="firstName" />
              <TextField form={form} label="Sobrenome" name="lastName" />
              <GenderField form={form} />
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>Dados de acesso</FieldLegend>
            <FieldDescription>
              Identificadores usados para localizar a conta.
            </FieldDescription>
            <FieldGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <TextField form={form} label="Nome de usuário" name="username" />
              <TextField form={form} label="RCA" name="rca" />
              <TextField form={form} label="E-mail" name="email" type="email" />
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>Acesso e permissões</FieldLegend>
            <FieldDescription>
              Status da conta e nível de acesso administrativo.
            </FieldDescription>
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <BooleanCombobox
                form={form}
                label="Status"
                name="isActive"
                options={[
                  { label: "Ativo", value: true },
                  { label: "Inativo", value: false },
                ]}
              />
              <BooleanCombobox
                form={form}
                label="Permissão"
                name="isAdmin"
                options={[
                  { label: "Administrador", value: true },
                  { label: "Usuário", value: false },
                ]}
              />
            </FieldGroup>
          </FieldSet>
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
      <PasswordResetSection
        isResetting={isResettingPassword}
        userId={user.id}
        onCancel={() => setIsResettingPassword(false)}
        onStart={() => setIsResettingPassword(true)}
      />
    </div>
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

function GenderField({
  form,
}: {
  form: ReturnType<typeof useForm<AdminUserUpdateInput>>;
}) {
  const error = form.formState.errors.gender;
  const id = "admin-user-gender";
  const genders: Array<{
    label: string;
    value: AdminUserUpdateInput["gender"];
  }> = [
    { label: "Masculino", value: "male" },
    { label: "Feminino", value: "female" },
  ];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>Gênero</FieldLabel>
      <Controller
        control={form.control}
        name="gender"
        render={({ field }) => (
          <Combobox
            itemToStringValue={(gender) => gender.label}
            items={genders}
            value={genders.find((gender) => gender.value === field.value)}
            onValueChange={(gender) => field.onChange(gender?.value)}
          >
            <ComboboxInput
              aria-invalid={Boolean(error)}
              id={id}
              placeholder="Selecione o gênero"
              onBlur={field.onBlur}
            />
            <ComboboxContent>
              <ComboboxEmpty>Nenhum gênero encontrado.</ComboboxEmpty>
              <ComboboxList>
                {(gender) => (
                  <ComboboxItem key={gender.value} value={gender}>
                    {gender.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      />
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

function BooleanCombobox({
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
          <Combobox
            itemToStringValue={(option) => option.label}
            items={options}
            value={options.find((option) => option.value === field.value)}
            onValueChange={(option) => field.onChange(option?.value)}
          >
            <ComboboxInput
              aria-invalid={Boolean(error)}
              id={id}
              onBlur={field.onBlur}
            />
            <ComboboxContent>
              <ComboboxEmpty>Nenhuma opção encontrada.</ComboboxEmpty>
              <ComboboxList>
                {(option) => (
                  <ComboboxItem key={String(option.value)} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      />
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

function PasswordResetSection({
  isResetting,
  userId,
  onCancel,
  onStart,
}: {
  isResetting: boolean;
  userId: number;
  onCancel: () => void;
  onStart: () => void;
}) {
  const form = useForm<AdminUserPasswordResetInput>({
    defaultValues: { mustChangePassword: true, password: "" },
    resolver: zodResolver(adminUserPasswordResetSchema),
  });
  const [showPassword, setShowPassword] = useState(false);
  const passwordError = form.formState.errors.password;
  const passwordId = `admin-user-${userId}-password`;
  const forceChangeId = `admin-user-${userId}-must-change-password`;

  function cancelReset() {
    form.reset({ mustChangePassword: true, password: "" });
    setShowPassword(false);
    onCancel();
  }

  async function onSubmit(values: AdminUserPasswordResetInput) {
    const response = await fetch(`/api/admin/users/${userId}/password`, {
      body: JSON.stringify(values),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });
    const data = (await response.json().catch(() => null)) as {
      issues?: { password?: string[] };
      message?: string;
    } | null;

    if (!response.ok) {
      const message = data?.issues?.password?.[0];
      if (message) form.setError("password", { message });
      toast.add({
        title: "Não foi possível redefinir a senha",
        description: data?.message ?? "Tente novamente.",
        type: "error",
      });
      return;
    }

    cancelReset();
    toast.add({
      title: "Senha redefinida",
      description: values.mustChangePassword
        ? "Senha temporária definida."
        : "A nova senha já pode ser usada.",
      type: "success",
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldLegend>Senha</FieldLegend>
        <FieldDescription>
          A senha atual não é exibida por segurança.
        </FieldDescription>
        {isResetting ? (
          <FieldGroup className="gap-3 sm:w-1/2">
            <Field data-invalid={Boolean(passwordError)}>
              <FieldLabel htmlFor={passwordId}>Nova senha</FieldLabel>
              <FieldGroup className="gap-2 sm:flex-row sm:items-center">
                <InputGroup className="min-w-0 flex-1">
                  <InputGroupInput
                    aria-invalid={Boolean(passwordError)}
                    autoComplete="new-password"
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    {...form.register("password")}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                      size="icon-sm"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <IconEyeOff aria-hidden="true" />
                      ) : (
                        <IconEye aria-hidden="true" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <Button
                  className="shrink-0"
                  type="button"
                  variant="outline"
                  onClick={() =>
                    form.setValue("password", generateRandomPassword(), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <IconRefresh aria-hidden="true" data-icon="inline-start" />
                  Gerar senha
                </Button>
              </FieldGroup>
              <FieldError
                errors={passwordError ? [passwordError] : undefined}
              />
            </Field>
            <Field orientation="horizontal">
              <Controller
                control={form.control}
                name="mustChangePassword"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    id={forceChangeId}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <FieldContent>
                <FieldLabel htmlFor={forceChangeId}>
                  Solicitar uma nova senha no próximo acesso
                </FieldLabel>
                <FieldDescription>
                  Quando marcado, esta senha será temporária.
                </FieldDescription>
              </FieldContent>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={cancelReset}>
                Cancelar
              </Button>
              <Button disabled={form.formState.isSubmitting} type="submit">
                <IconKey aria-hidden="true" data-icon="inline-start" />
                {form.formState.isSubmitting
                  ? "Redefinindo..."
                  : "Redefinir senha"}
              </Button>
            </div>
          </FieldGroup>
        ) : (
          <Button
            className="self-start"
            type="button"
            variant="outline"
            onClick={onStart}
          >
            <IconKey aria-hidden="true" data-icon="inline-start" />
            Redefinir senha
          </Button>
        )}
      </FieldSet>
    </form>
  );
}
