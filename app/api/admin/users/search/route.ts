import { searchAdminUsernames } from "@/lib/admin/users";
import { authorizeStudioRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const authorizationError = await authorizeStudioRequest();
  if (authorizationError) return authorizationError;

  const url = new URL(request.url);
  const results = await searchAdminUsernames(url.searchParams.get("q") ?? "");

  return Response.json({ results });
}
