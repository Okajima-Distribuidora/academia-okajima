import { z } from "zod";

export const isLoginEmail = (value: string) =>
  z.email().safeParse(value).success;

export const credentialsSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Informe seu RCA ou e-mail.")
    .max(255, "Use até 255 caracteres.")
    .refine(
      (value) => value.length <= 32 || isLoginEmail(value),
      "Informe um RCA ou e-mail válido.",
    ),
  // Transport bound, not a new-password policy. Never trim/normalize passwords.
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .max(1024, "Senha muito longa."),
});

export const newPasswordSchema = z
  .string()
  .min(5, "A senha deve ter pelo menos 5 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.")
  .refine(
    (value) => !bcryptTruncates(value),
    "A senha deve ter no máximo 72 bytes UTF-8.",
  );

function bcryptTruncates(password: string) {
  return new TextEncoder().encode(password).byteLength > 72;
}

export const passwordChangeSchema = z
  .object({
    password: newPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });
