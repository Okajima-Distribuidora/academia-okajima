import { auth } from "@/auth";
import { searchHomeVideos } from "@/lib/home/catalog";
import { normalizeHomeSearch } from "@/lib/home/navigation";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ results: [] }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = normalizeHomeSearch(url.searchParams.get("q"));
  const results = await searchHomeVideos(query, 7);

  return Response.json({ results });
}
