// Supabase Edge Function — Deno runtime
// Envoie un email de confirmation de réservation via Resend.
// Appelé depuis le client (ReservationDialog, Overview, Reservations).
//
// Design:
// - Récupère l'utilisateur authentifié via le JWT (header Authorization)
// - Charge la réservation + le profil
// - Construit un email HTML simple et l'envoie via l'API Resend
// - Si RESEND_API_KEY n'est pas configurée, log et renvoie 200 ok:false
//   pour ne jamais casser le flux principal de réservation.

// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Kind = "created" | "updated" | "cancelled";

interface Payload {
  reservation_id: string;
  kind?: Kind;
}

const subjects: Record<Kind, string> = {
  created: "Votre réservation SmartPark est confirmée",
  updated: "Votre réservation SmartPark a été mise à jour",
  cancelled: "Votre réservation SmartPark a été annulée",
};

function formatRange(startIso: string, endIso: string) {
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Tunis",
  });
  return `du ${fmt.format(new Date(startIso))} au ${fmt.format(new Date(endIso))}`;
}

function buildHtml(params: {
  fullName: string;
  spot: number;
  range: string;
  kind: Kind;
}) {
  const intro: Record<Kind, string> = {
    created: `Bonjour ${params.fullName || ""}, votre réservation est confirmée.`,
    updated: `Bonjour ${params.fullName || ""}, votre réservation a été mise à jour.`,
    cancelled: `Bonjour ${params.fullName || ""}, votre réservation a été annulée.`,
  };

  return `
  <div style="font-family: -apple-system,Segoe UI,Arial,sans-serif; color:#111; padding:24px; max-width:560px;">
    <h2 style="margin:0 0 16px;">SmartPark</h2>
    <p style="font-size:15px; line-height:1.5;">${intro[params.kind]}</p>
    <div style="margin:20px 0; padding:16px; border-radius:10px; background:#f6f8fb;">
      <div><strong>Place :</strong> P${params.spot}</div>
      <div style="margin-top:6px;"><strong>Plage horaire :</strong> ${params.range}</div>
    </div>
    <p style="font-size:13px; color:#666;">Vous pouvez gérer vos réservations depuis votre tableau de bord.</p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ ok: false, error: "unauthenticated" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { reservation_id, kind = "created" } = (await req.json()) as Payload;
    if (!reservation_id) {
      return new Response(JSON.stringify({ ok: false, error: "missing_reservation_id" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .select("id, spot_number, start_time, end_time, user_id")
      .eq("id", reservation_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (resErr || !reservation) {
      return new Response(JSON.stringify({ ok: false, error: "reservation_not_found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle();

    const to = profile?.email || user.email;
    if (!to) {
      return new Response(JSON.stringify({ ok: false, error: "no_email" }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("[send-reservation-email] RESEND_API_KEY not set — skipping send", {
        to,
        reservation_id,
        kind,
      });
      return new Response(JSON.stringify({ ok: false, skipped: true }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const from = Deno.env.get("RESEND_FROM") ?? "SmartPark <onboarding@resend.dev>";
    const html = buildHtml({
      fullName: profile?.full_name ?? "",
      spot: reservation.spot_number,
      range: formatRange(reservation.start_time, reservation.end_time),
      kind,
    });

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: subjects[kind],
        html,
      }),
    });

    if (!resendRes.ok) {
      const text = await resendRes.text();
      console.error("[send-reservation-email] Resend error", resendRes.status, text);
      return new Response(JSON.stringify({ ok: false, error: "resend_error" }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-reservation-email] unexpected", err);
    return new Response(JSON.stringify({ ok: false, error: "internal" }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
