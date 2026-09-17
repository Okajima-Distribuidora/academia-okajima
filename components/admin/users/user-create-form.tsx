"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconCopy,
  IconDeviceFloppy,
  IconEye,
  IconEyeOff,
  IconKey,
  IconRefresh,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { useCreateAdminUser } from "@/hooks/queries/use-admin-users";
import {
  type AdminUserCreateInput,
  adminUserCreateSchema,
} from "@/lib/admin/users/validation";
import { ApiError } from "@/lib/query/http";
import { generateRandomPassword } from "./utils/password";

const formId = "admin-user-create-form";

const defaultValues: AdminUserCreateInput = {
  email: "",
  firstName: "",
  gender: "male",
  isActive: true,
  isAdmin: false,
  lastName: "",
  mustChangePassword: true,
  password: "",
  rca: "",
  username: "",
};

export function UserCreateForm() {
  const router = useRouter();
  const form = useForm<AdminUserCreateInput>({
    defaultValues,
    resolver: zodResolver(adminUserCreateSchema),
  });
  const createUser = useCreateAdminUser();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
    null,
  );

  async function onSubmit(values: AdminUserCreateInput) {
    try {
      const user = await createUser.mutateAsync(values);
      toast.add({
        title: "Usuário criado",
        description: "O usuário foi incluído com sucesso.",
        type: "success",
      });
      if (user.temporaryPassword) {
        setTemporaryPassword(user.temporaryPassword);
      } else {
        router.replace("/admin/usuarios");
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        form.setError("rca", { message: error.message });
        form.setError("email", { message: error.message });
      }

      toast.add({
        title: "Não foi possível criar o usuário",
        description:
          error instanceof Error ? error.message : "Tente novamente.",
        type: "error",
      });
    }
  }

  return (
    <Card>
      <CardContent>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-8">
            <FieldSet>
              <FieldLegend className="text-xl!">Dados pessoais</FieldLegend>
              <FieldDescription>
                Informações de identificação e contato do usuário.
              </FieldDescription>
              <FieldGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <TextField form={form} label="Nome" name="firstName" />
                <TextField form={form} label="Sobrenome" name="lastName" />
                <GenderCombobox form={form} />
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend className="text-xl!">Dados de acesso</FieldLegend>
              <FieldDescription>
                Identificadores usados para localizar a conta.
              </FieldDescription>
              <FieldGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <TextField
                  form={form}
                  label="Nome de usuário"
                  name="username"
                />
                <TextField form={form} label="RCA" name="rca" />
                <TextField
                  form={form}
                  label="E-mail"
                  name="email"
                  type="email"
                />
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend className="text-xl!">
                Acesso e permissões
              </FieldLegend>
              <FieldDescription>
                Defina se a conta será ativada e seu nível de acesso.
              </FieldDescription>
              <FieldGroup className="grid gap-5 sm:grid-cols-2">
                <ActiveStatus form={form} />
                <PermissionCombobox form={form} />
              </FieldGroup>
            </FieldSet>
            <FieldSet>
              <FieldLegend className="text-xl!">Senha</FieldLegend>
              <FieldDescription>
                Defina a senha da conta ou gere uma senha aleatória.
              </FieldDescription>
              <FieldGroup className="gap-3 sm:w-1/2">
                <PasswordField form={form} />
                <RequirePasswordChange form={form} />
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/usuarios"
        >
          Cancelar
        </Link>
        <Button disabled={createUser.isPending} form={formId} type="submit">
          {createUser.isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <IconDeviceFloppy data-icon="inline-start" aria-hidden="true" />
          )}
          Criar usuário
        </Button>
      </CardFooter>
      <Dialog
        open={Boolean(temporaryPassword)}
        onOpenChange={(open) => {
          if (!open) {
            setTemporaryPassword(null);
            router.replace("/admin/usuarios");
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="text-xl! mb-2">
              Senha temporária
            </DialogTitle>
            <DialogDescription>
              Compartilhe esta senha temporária com o RCA.
            </DialogDescription>
          </DialogHeader>
          <InputGroup>
            <InputGroupInput
              aria-label="Senha temporária"
              readOnly
              value={temporaryPassword ?? ""}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="Copiar senha temporária"
                size="icon-sm"
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(temporaryPassword ?? "")
                }
              >
                <IconCopy aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                />
              }
            >
              Fechar
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TextField({
  form,
  label,
  name,
  type = "text",
}: {
  form: ReturnType<typeof useForm<AdminUserCreateInput>>;
  label: string;
  name: keyof Pick<
    AdminUserCreateInput,
    "username" | "firstName" | "lastName" | "rca" | "email"
  >;
  type?: "email" | "text";
}) {
  const error = form.formState.errors[name];
  const id = `admin-user-create-${name}`;

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

function GenderCombobox({
  form,
}: {
  form: ReturnType<typeof useForm<AdminUserCreateInput>>;
}) {
  const error = form.formState.errors.gender;
  const id = "admin-user-create-gender";
  const genders: Array<{
    label: string;
    value: AdminUserCreateInput["gender"];
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
            items={genders}
            itemToStringValue={(gender) => gender.label}
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

function ActiveStatus({
  form,
}: {
  form: ReturnType<typeof useForm<AdminUserCreateInput>>;
}) {
  const id = "admin-user-create-is-active";

  return (
    <Field className="items-center" orientation="horizontal">
      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <Switch
            checked={field.value}
            size="lg"
            id={id}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>Ativar usuário</FieldLabel>
        <FieldDescription>
          Quando marcado, o usuário ficará ativo imediatamente após a criação.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}

function PasswordField({
  form,
}: {
  form: ReturnType<typeof useForm<AdminUserCreateInput>>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const error = form.formState.errors.password;
  const id = "admin-user-create-password";

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>Senha</FieldLabel>
      <FieldGroup className="gap-2 sm:flex-row sm:items-center">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupInput
            aria-invalid={Boolean(error)}
            autoComplete="new-password"
            id={id}
            type={showPassword ? "text" : "password"}
            {...form.register("password")}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
      <FieldError errors={error ? [error] : undefined} />
    </Field>
  );
}

function RequirePasswordChange({
  form,
}: {
  form: ReturnType<typeof useForm<AdminUserCreateInput>>;
}) {
  const id = "admin-user-create-must-change-password";

  return (
    <Field orientation="horizontal">
      <Controller
        control={form.control}
        name="mustChangePassword"
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            id={id}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <FieldContent>
        <FieldLabel htmlFor={id}>
          Deixar para o usuário criar sua senha no primeiro acesso
        </FieldLabel>
        <FieldDescription>
          Quando marcado, a senha informada será temporária.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}

function PermissionCombobox({
  form,
}: {
  form: ReturnType<typeof useForm<AdminUserCreateInput>>;
}) {
  const error = form.formState.errors.isAdmin;
  const id = "admin-user-create-is-admin";
  const permissions = ["Usuário", "Administrador"];

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>Nível de acesso</FieldLabel>
      <Controller
        control={form.control}
        name="isAdmin"
        render={({ field }) => (
          <Combobox
            items={permissions}
            value={field.value ? "Administrador" : "Usuário"}
            onValueChange={(value) => field.onChange(value === "Administrador")}
          >
            <ComboboxInput
              aria-invalid={Boolean(error)}
              id={id}
              placeholder="Selecione o nível de acesso"
              onBlur={field.onBlur}
            />
            <ComboboxContent>
              <ComboboxEmpty>Nenhum nível de acesso encontrado.</ComboboxEmpty>
              <ComboboxList>
                {(permission: string) => (
                  <ComboboxItem key={permission} value={permission}>
                    {permission}
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
