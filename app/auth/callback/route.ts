import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function redirectUrl(request: NextRequest, path: string) {
  const url = request.nextUrl;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "development"
      ? url.origin
      : forwardedHost
        ? `https://${forwardedHost}`
        : url.origin;
  return new URL(path, base);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(redirectUrl(request, "/login"));

  // Cookies must be written onto this redirect response. Using cookies().set()
  // from next/headers and then returning NextResponse.redirect() drops the
  // session, so Google OAuth appears to succeed and then the user is asked again.
  const response = NextResponse.redirect(redirectUrl(request, next));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(redirectUrl(request, "/login?error=oauth"));

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from("profiles").upsert(
      {
        auth_user_id: data.user.id,
        display_name:
          data.user.user_metadata?.full_name ??
          data.user.email?.split("@")[0] ??
          "Shinobi",
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
      },
      { onConflict: "auth_user_id", ignoreDuplicates: false }
    );
  }

  return response;
}
