import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only: create or update a login account for a barber and link it.
 * - If the barber row already has a user_id, updates that auth user's email/password.
 * - Otherwise creates a new auth user (email-confirmed) and links it.
 * - Always ensures the user has the 'barber' role.
 */
export const setBarberCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        barberId: z.string().uuid(),
        email: z.string().email().max(255),
        password: z.string().min(8).max(72).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // Authorize: caller must be admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin role required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch the barber row
    const { data: barber, error: bErr } = await supabaseAdmin
      .from("barbers")
      .select("id, user_id, email")
      .eq("id", data.barberId)
      .maybeSingle();
    if (bErr) throw new Error(bErr.message);
    if (!barber) throw new Error("Barber not found");

    let userId = (barber as any).user_id as string | null;

    if (userId) {
      // Update existing auth user
      const updates: { email?: string; password?: string } = {};
      updates.email = data.email;
      if (data.password) updates.password = data.password;
      const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ...updates,
        email_confirm: true,
      } as any);
      if (uErr) throw new Error(uErr.message);
    } else {
      // Need a password to create a new account
      if (!data.password) throw new Error("Password required to create a new barber account");

      // Check if an auth user already exists with this email
      const { data: list, error: lErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      } as any);
      if (lErr) throw new Error(lErr.message);
      const existing = list?.users?.find(
        (u) => (u.email ?? "").toLowerCase() === data.email.toLowerCase(),
      );

      if (existing) {
        userId = existing.id;
        const { error: uErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: data.password,
          email_confirm: true,
        } as any);
        if (uErr) throw new Error(uErr.message);
      } else {
        const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
        });
        if (cErr) throw new Error(cErr.message);
        userId = created.user?.id ?? null;
        if (!userId) throw new Error("Failed to create auth user");
      }
    }

    // Link the barber row
    const { error: linkErr } = await supabaseAdmin
      .from("barbers")
      .update({ user_id: userId, email: data.email })
      .eq("id", data.barberId);
    if (linkErr) throw new Error(linkErr.message);

    // Ensure 'barber' role
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "barber" as any }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true, userId };
  });

/**
 * Authenticated barber: returns their barber profile + today's bookings (Baghdad time).
 */
export const getMyBarberDay = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: barber, error: bErr } = await context.supabase
      .from("barbers")
      .select("id, name_en, name_ar, email")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (bErr) throw new Error(bErr.message);
    if (!barber) return { barber: null, bookings: [] };

    // "Today" in Baghdad (UTC+3)
    const now = new Date();
    const baghdad = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const y = baghdad.getUTCFullYear();
    const mo = baghdad.getUTCMonth();
    const d = baghdad.getUTCDate();
    const startUtc = new Date(Date.UTC(y, mo, d, -3, 0, 0));
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

    const { data: bookings, error: kErr } = await context.supabase
      .from("bookings")
      .select("id, starts_at, ends_at, status, price_iqd, customers(name, phone), services(name_en, name_ar)")
      .eq("barber_id", (barber as any).id)
      .gte("starts_at", startUtc.toISOString())
      .lt("starts_at", endUtc.toISOString())
      .order("starts_at", { ascending: true });
    if (kErr) throw new Error(kErr.message);

    return { barber, bookings: bookings ?? [] };
  });