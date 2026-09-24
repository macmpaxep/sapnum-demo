import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Lightweight, best-effort page-view counter for the daily Telegram
// digest — one row per page navigation. Fire-and-forget: never awaited,
// never allowed to affect the response, and skipped for API/asset
// requests so it only tracks actual page loads.
function logPageView(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.method !== "GET" || pathname.startsWith("/api")) return;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  fetch(`${url}/rest/v1/page_views`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ path: pathname }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  logPageView(request);
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
