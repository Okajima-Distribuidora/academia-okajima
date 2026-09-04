import { z } from "zod";

export const isLoginEmail = (value: string) => z.email().safeParse(value).success;

export const credentialsSchema = z.object({
  identifier: z.string().trim().min(1, "Informe seu RCA ou e-mail.")
    .max(255, "Use até 255 caracteres.")
    .refine((value) => value.length <= 32 || isLoginEmail(value), "Informe um RCA ou e-mail válido."),
  // Transport bound, not a new-password policy. Never trim/normalize passwords.
  password: z.string().min(1, "Informe sua senha.").max(1024, "Senha muito longa."),
});
