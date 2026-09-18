import { resetAdminUserPassword } from "@/lib/admin/users";
import { adminUserPasswordResetSchema } from "@/lib/admin/users/validation";
import { authorizeStudioRequest } from "@/lib/auth/session";

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/admin/users/[userId]/password">,
) {
  const authorizationError = await authorizeStudioRequest();
  if (authorizationError) return authorizationError;

  const body = await request.json().catch(() => null);
  const parsedInput = adminUserPasswordResetSchema.safeParse(body);

  if (!parsedInput.success) {
    return Response.json(
      {
        message: "Confira os dados informados.",
        issues: parsedInput.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { userId } = await params;
  const updated = await resetAdminUserPassword(userId, parsedInput.data);

  if (!updated) {
    return Response.json(
      { message: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  return Response.json({ ok: true });
}
