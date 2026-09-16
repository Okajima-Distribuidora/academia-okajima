import { reconcileVideoUpload } from "@/lib/studio/uploads/sync";
import { listVideoUploadsForReconciliation } from "@/lib/studio/uploads/records";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return Response.json({ message: "Não autorizado." }, { status: 401 });
  }

  const uploads = await listVideoUploadsForReconciliation(25);
  const results = await Promise.allSettled(uploads.map(reconcileVideoUpload));
  const failed = results.filter(
    (result) => result.status === "rejected",
  ).length;

  if (failed > 0) {
    console.error("[academia-vimeo] reconciliation_incomplete", {
      attempted: uploads.length,
      failed,
    });
  }

  return Response.json({ attempted: uploads.length, failed });
}
