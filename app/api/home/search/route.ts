import { getCurrentUser } from "@/lib/auth/session";
import { searchHomeVideos } from "@/lib/home/catalog";
import { normalizeHomeSearch } from "@/lib/home/navigation";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mustChangePassword) {
    return Response.json({ results: [] }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = normalizeHomeSearch(url.searchParams.get("q"));
  const results = await searchHomeVideos(query, 7);

  return Response.json({ results });
}
