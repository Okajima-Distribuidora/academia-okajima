import { changeTemporaryPassword } from "@/lib/auth/password-change";
import { getCurrentUser } from "@/lib/auth/session";
import { passwordChangeSchema } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json(
      { message: "Você precisa entrar novamente." },
      { status: 401 },
    );
  }
  if (!user.mustChangePassword) {
    return Response.json(
      { message: "A senha já foi definida." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message: "Confira os dados informados.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const changed = await changeTemporaryPassword(user.id, parsed.data.password);
  if (!changed) {
    return Response.json(
      { message: "A senha já foi definida." },
      { status: 409 },
    );
  }
  return Response.json({ ok: true });
}
