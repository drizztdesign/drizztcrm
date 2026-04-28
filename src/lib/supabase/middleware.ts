import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// CRITICAL: API routes (/api/*) skip the session redirect. Each API route
// runs its own auth check (per-user via Supabase cookies, or Bearer token /
// secret query for cron endpoints). Without this skip, Vercel Cron requests
// would be redirected to /login and never reach the cron handler.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/forgot-password");
  // /reset-password is intentionally NOT an auth route: users land here with a
  // recovery session created by Supabase from the email link, so they are
  // authenticated when they arrive. We want the normal authenticated flow.
  const isResetPassword = pathname.startsWith("/reset-password");
  // API routes do their own auth (per-route checks). Critically, the cron
  // endpoints under /api/email/*-cron must bypass session checks because
  // Vercel Cron has no user session — it sends a Bearer token instead.
  const isApi = pathname.startsWith("/api/");
  const isPublic = pathname === "/favicon.ico" || pathname.startsWith("/_next");

  if (!user && !isAuthRoute && !isPublic && !isResetPassword && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
