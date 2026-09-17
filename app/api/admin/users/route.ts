import {
  AdminUserIdentifierConflictError,
  createAdminUser,
  getAdminUsersPage,
  getAdminUsersPageSize,
  getAdminUsersSearch,
  getAdminUsersStats,
  listAdminUsers,
} from "@/lib/admin/users";
import { adminUserCreateSchema } from "@/lib/admin/users/validation";
import { authorizeStudioRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const authorizationError = await authorizeStudioRequest();
  if (authorizationError) return authorizationError;

  const searchParams = new URL(request.url).searchParams;
  const page = getAdminUsersPage(searchParams.get("pagina") ?? undefined);
  const pageSize = getAdminUsersPageSize(
    searchParams.get("quantidade") ?? undefined,
  );
  const search = getAdminUsersSearch(searchParams.get("busca") ?? undefined);
  const [users, stats] = await Promise.all([
    listAdminUsers(page, pageSize, search),
    getAdminUsersStats(),
  ]);

  return Response.json({ stats, users });
}

export async function POST(request: Request) {
  const authorizationError = await authorizeStudioRequest();
  if (authorizationError) return authorizationError;

  const body = await request.json().catch(() => null);
  const parsedInput = adminUserCreateSchema.safeParse(body);

  if (!parsedInput.success) {
    return Response.json(
      {
        message: "Confira os dados informados.",
        issues: parsedInput.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    const user = await createAdminUser(parsedInput.data);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminUserIdentifierConflictError) {
      return Response.json(
        {
          message: error.message,
          issues: {
            email: [error.message],
            rca: [error.message],
          },
        },
        { status: 409 },
      );
    }

    throw error;
  }
}
