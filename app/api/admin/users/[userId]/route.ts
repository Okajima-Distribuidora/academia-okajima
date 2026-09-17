import { updateAdminUser } from "@/lib/admin/users";
import { adminUserUpdateSchema } from "@/lib/admin/users/validation";
import { authorizeStudioRequest } from "@/lib/auth/session";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/users/[userId]">,
) {
  const authorizationError = await authorizeStudioRequest();
  if (authorizationError) return authorizationError;

  const body = await request.json().catch(() => null);
  const parsedInput = adminUserUpdateSchema.safeParse(body);

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
  const user = await updateAdminUser(userId, parsedInput.data);

  if (!user) {
    return Response.json(
      { message: "Usuário não encontrado." },
      { status: 404 },
    );
  }

  return Response.json({ user });
}
