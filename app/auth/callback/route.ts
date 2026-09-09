import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  if (!code) return NextResponse.redirect(new URL("/login", url.origin));

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=oauth", url.origin));

  // Ensure profile row exists for the new auth user.
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
  return NextResponse.redirect(new URL(next, url.origin));
}
