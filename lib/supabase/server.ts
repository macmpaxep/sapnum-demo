import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server Component / Route Handler client — reads the session from cookies.
// In a Server Component, cookie writes are ignored (Next.js forbids them);
// the middleware is responsible for refreshing and persisting the session.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — safe to ignore, middleware handles refresh
          }
        },
      },
    }
  );
}
