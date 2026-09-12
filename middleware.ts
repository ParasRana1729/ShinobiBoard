import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function middleware(request: NextRequest) {
  // Refresh session cookie for server components. Public pages stay accessible;
  // API routes + pages enforce auth themselves so cron (secret-based) still works.
  // Recreate the request/response when cookies change so Server Components see
  // the session on the same request (required by @supabase/ssr).
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && request.nextUrl.pathname === "/login") {
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const redirectResponse = NextResponse.redirect(new URL(next, request.url));
    for (const cookie of response.headers.getSetCookie()) {
      redirectResponse.headers.append("Set-Cookie", cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  // Skip the OAuth callback so middleware getUser() cannot clear the PKCE
  // verifier cookie before exchangeCodeForSession runs.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
