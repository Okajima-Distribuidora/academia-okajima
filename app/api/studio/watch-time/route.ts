import { z } from "zod";
import { authorizeStudioRequest } from "@/lib/auth/session";
import { getWatchTimeReport } from "@/lib/studio/stats/watch-time";

const id = z.coerce.number().int().positive().max(2147483647).optional();
const schema = z.object({
  period: z.enum(["all", "24h", "7d", "28d"]).default("28d"),
  videoId: id,
  userId: id,
  categoryId: id,
  subcategoryId: id,
});

export async function GET(request: Request) {
  const denied = await authorizeStudioRequest();
  if (denied) return denied;
  const input = schema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!input.success)
    return Response.json({ message: "Filtros inválidos." }, { status: 400 });
  const { period, ...scope } = input.data;
  return Response.json(await getWatchTimeReport(scope, period), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
