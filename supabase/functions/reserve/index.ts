// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200);
  }

  try {
    // ── Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Non authentifié" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Token invalide" }, 401);

    // ── Parse body ────────────────────────────────────────
    const { spot_id, vehicle_id } = await req.json();
    if (!spot_id || !vehicle_id) {
      return json({ error: "spot_id et vehicle_id requis" }, 400);
    }

    // ── Check 1: Phone verified ───────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone_verified, daily_res_count, daily_reset_at, ban_until")
      .eq("id", user.id)
      .single();

    if (!profile?.phone_verified) {
      return json({ error: "Vérifiez votre numéro de téléphone" }, 403);
    }

    // ── Check 2: Not banned ───────────────────────────────
    if (profile.ban_until && new Date(profile.ban_until) > new Date()) {
      const isPermanent = new Date(profile.ban_until).getFullYear() > 2090;
      const banDate = new Date(profile.ban_until).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric"
      });
      return json({
        error: isPermanent
          ? "Compte suspendu définitivement — contactez le support"
          : `Compte suspendu jusqu'au ${banDate}`,
      }, 403);
    }

    // ── Check 3: Vehicle belongs to user ──────────────────
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, plate")
      .eq("id", vehicle_id)
      .eq("user_id", user.id)
      .single();

    if (!vehicle) {
      return json({ error: "Véhicule introuvable ou non autorisé" }, 403);
    }

    // ── Check 4: No current active/pending reservation ────
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["pending", "active"])
      .maybeSingle();

    if (existing) {
      return json({ error: "Vous avez déjà une réservation en cours" }, 403);
    }

    // ── Check 5: Daily cap (3/day) ────────────────────────
    const today = new Date().toISOString().split("T")[0];
    const dailyCount =
      profile.daily_reset_at === today ? profile.daily_res_count : 0;

    if (dailyCount >= 3) {
      return json({ error: "Limite journalière atteinte (3/jour)" }, 403);
    }

    // ── Check 6: Same-spot cooldown (40 min) ──────────────
    const { data: spotCooldown } = await supabase
      .from("reservation_cooldowns")
      .select("blocked_until")
      .eq("user_id", user.id)
      .eq("spot_id", spot_id)
      .maybeSingle();

    if (spotCooldown && new Date(spotCooldown.blocked_until) > new Date()) {
      const remaining = Math.ceil(
        (new Date(spotCooldown.blocked_until).getTime() - Date.now()) / 60000
      );
      return json({
        error: `Attendez encore ${remaining} min avant de réserver cette place à nouveau`,
      }, 403);
    }

    // ── Check 7: Global cooldown (20 min) — only for different spots ──────
    const { data: globalCooldown } = await supabase
      .from("reservation_cooldowns")
      .select("blocked_until, spot_id")
      .eq("user_id", user.id)
      .eq("spot_id", -1)
      .maybeSingle();

    if (globalCooldown && new Date(globalCooldown.blocked_until) > new Date()) {
      const remaining = Math.ceil(
        (new Date(globalCooldown.blocked_until).getTime() - Date.now()) / 60000
      );
      return json({
        error: `Attendez encore ${remaining} min avant de réserver une autre place`,
      }, 403);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // ── Check 8: Atomic spot claim ────────────────────────
    const { data: claimedSpots, error: claimError } = await serviceClient
      .from("parking_spots")
      .update({ status: "pending", last_updated: new Date().toISOString(), expires_at: expiresAt, current_plate: vehicle.plate, })
      .eq("id", spot_id)
      .eq("status", "free")
      .select("id");

    if (claimError || !claimedSpots || claimedSpots.length === 0) {
      return json({ error: "Cette place vient d'être prise" }, 409);
    }

    // ── Log occupied event ────────────────────────────────────────
    await serviceClient
      .from("spot_events")
      .insert({ spot_id: spot_id, event: "occupied" });

    // ── Create reservation ────────────────────────────────

    const { data: reservation, error: resError } = await serviceClient
      .from("reservations")
      .insert({
        user_id: user.id,
        spot_number: spot_id,
        vehicle_id: vehicle.id,
        plate: vehicle.plate,
        status: "pending",
        expires_at: expiresAt,
        grace_minutes: 15,
      })
      .select("id, spot_number, plate, expires_at")
      .single();

    if (resError) {
      // Roll back spot
      await serviceClient
        .from("parking_spots")
        .update({ status: "free", last_updated: new Date().toISOString() })
        .eq("id", spot_id);
      return json({ error: "Cette place vient d'être prise" }, 409);
    }

    // ── Set cooldowns ─────────────────────────────────────
    const globalUntil = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    const spotUntil = new Date(Date.now() + 40 * 60 * 1000).toISOString();

    await serviceClient
      .from("reservation_cooldowns")
      .upsert([
        { user_id: user.id, spot_id: -1, blocked_until: globalUntil, reason: "global" },
        { user_id: user.id, spot_id: spot_id, blocked_until: spotUntil, reason: "same_spot" },
      ]);

    return json({ reservation }, 200);

  } catch (err) {
    console.error(err);
    return json({ error: "Erreur serveur" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}