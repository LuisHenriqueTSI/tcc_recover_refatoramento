// @ts-nocheck
/// <reference types="https://deno.land/std@0.224.0/types.d.ts" />
// Edge Function: notify-item-found
// Triggered via Postgres trigger (net.http_post) when an item is marcado como encontrado.
// Sends an email to the dono do item via Brevo API.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Send email via Brevo API
async function sendEmail(payload) {
  const smtpKey = Deno.env.get("SMTP_USERNAME");
  const senderEmail = Deno.env.get("SMTP_SENDER_EMAIL");
  const senderName = Deno.env.get("SMTP_SENDER_NAME") ?? "Recover";

  if (!smtpKey || !senderEmail) {
    console.error("[emailClient] Missing Brevo env vars");
    throw new Error("Brevo configuration is incomplete");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": smtpKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: payload.to }],
      subject: payload.subject,
      textContent: payload.text,
      htmlContent: payload.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[sendEmail] Brevo API error:", error);
    throw new Error(`Failed to send email: ${response.status}`);
  }
}

serve(async (req: Request) => {
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

    // Only act when status transitioned to "found"
    const wasFound = oldRecord?.status === "found";
    const isFound = record.status === "found";
    if (wasFound || !isFound) {
      return new Response("No change to found state", { status: 200 });
    }

    const supabaseUrl = Deno.env.get("SB_URL");
    const serviceRoleKey = Deno.env.get("SB_SERVICE_ROLE_KEY");
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
