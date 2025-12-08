// Edge Function: notify-item-found
// Triggered via Postgres trigger (net.http_post) when an item is marcado como encontrado.
// Sends an email to the dono do item avisando que alguém sinalizou o item como encontrado.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail } from "../_shared/emailClient.ts";

serve(async (req) => {
  try {
    const functionSecret = Deno.env.get("FUNCTION_SECRET");
    if (functionSecret) {
      const headerSecret = req.headers.get("x-function-secret");
      if (headerSecret !== functionSecret) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    const payload = await req.json();
    const record = payload.record;
    const oldRecord = payload.old_record;

    if (!record) {
      return new Response("Missing record", { status: 400 });
    }

    // Only act when status transitioned to "found" (or boolean true)
    const wasFound = oldRecord?.status === "found" || oldRecord?.found === true;
    const isFound = record.status === "found" || record.found === true;
    if (wasFound || !isFound) {
      return new Response("No change to found state", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "https://recover.app";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[notify-item-found] Missing Supabase env vars");
      return new Response("Server misconfigured", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch owner info
    const { data: ownerProfile, error: ownerError } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", record.owner_id)
      .single();

    if (ownerError || !ownerProfile?.email) {
      console.error("[notify-item-found] Owner fetch error", ownerError);
      return new Response("Owner not found", { status: 400 });
    }

    const itemTitle = record.title || record.name || "Seu item";
    const subject = `Alguém sinalizou que encontrou: ${itemTitle}`;
    const itemLink = `${frontendUrl}/item/${record.id}`;

    const text =
`Boa notícia! Alguém sinalizou que encontrou o item: ${itemTitle}.

Acesse o app para ver detalhes e combinar a entrega: ${itemLink}
`;

    const html =
`<p>Boa notícia! Alguém sinalizou que encontrou o item: <strong>${escapeHtml(itemTitle)}</strong>.</p>
<p><a href="${itemLink}" target="_blank" rel="noopener noreferrer">Abrir item</a></p>`;

    await sendEmail({
      to: ownerProfile.email,
      subject,
      text,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-item-found] Error", err);
    return new Response("Internal error", { status: 500 });
  }
});

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
