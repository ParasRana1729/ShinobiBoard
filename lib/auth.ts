import { createClient } from "@/lib/supabase/server";

/** Returns auth user id or null (never throws — routes map null → 401). */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getAuthUser() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
