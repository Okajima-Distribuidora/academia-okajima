import { z } from "zod";
import { newPasswordSchema } from "@/lib/auth/validation";

export const adminUserUpdateSchema = z.object({
  email: z
    .string()
    .trim()
    .max(255, "O e-mail deve ter no máximo 255 caracteres.")
    .refine(
      (value) => !value || z.email().safeParse(value).success,
      "Informe um e-mail válido.",
    ),
  firstName: z
    .string()
    .trim()
    .max(50, "O nome deve ter no máximo 50 caracteres."),
  gender: z.enum(["male", "female"]),
  isActive: z.boolean(),
  isAdmin: z.boolean(),
  lastName: z
    .string()
    .trim()
    .max(50, "O sobrenome deve ter no máximo 50 caracteres."),
  rca: z.string().trim().max(32, "O RCA deve ter no máximo 32 caracteres."),
  username: z
    .string()
    .trim()
    .min(1, "Informe o nome de usuário.")
    .max(255, "O nome de usuário deve ter no máximo 255 caracteres."),
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

export const adminUserPasswordResetSchema = z.object({
  mustChangePassword: z.boolean(),
  password: newPasswordSchema,
});

export type AdminUserPasswordResetInput = z.infer<
  typeof adminUserPasswordResetSchema
>;

export const adminUserCreateSchema = adminUserUpdateSchema.extend({
  gender: z.enum(["male", "female"]),
  mustChangePassword: z.boolean(),
  password: newPasswordSchema,
  rca: z
    .string()
    .trim()
    .min(1, "Informe o RCA.")
    .max(32, "O RCA deve ter no máximo 32 caracteres."),
});

export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
