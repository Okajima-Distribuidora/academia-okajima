import { NextRequest } from "next/server";
import { handlers } from "@/auth";

export const runtime = "nodejs";
export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  // Bound the actual stream, not just the untrusted Content-Length header.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 16_384) {
        void reader.cancel();
        return Response.json({ url: "/login?error=CredentialsSignin" }, { status: 413 });
      }
      chunks.push(value);
    }
  }
  return handlers.POST(new NextRequest(request.url, {
    method: "POST", headers: new Headers(request.headers), body: Buffer.concat(chunks),
  }));
}
