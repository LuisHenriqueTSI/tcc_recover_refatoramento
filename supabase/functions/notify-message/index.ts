// Edge Function: notify-message
// Triggered via Postgres trigger (net.http_post) on messages inserts.
// Sends an email to the recipient with a link to the chat.

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

    if (!record) {
      return new Response("Missing record", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "https://recover.app";

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[notify-message] Missing Supabase env vars");
      return new Response("Server misconfigured", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch recipient info
    const { data: recipientProfile, error: recipientError } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", record.recipient_id)
      .single();

    if (recipientError || !recipientProfile?.email) {
      console.error("[notify-message] Recipient fetch error", recipientError);
      return new Response("Recipient not found", { status: 400 });
    }

    // Fetch sender info (optional)
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", record.sender_id)
      .maybeSingle();

    const senderName = senderProfile?.name || "um usuário";

    const subject = `Nova mensagem de ${senderName}`;
    const messageText = record.content?.trim() || "(Mensagem sem texto ou com foto)";
    const chatLink = `${frontendUrl}/chat`;

    const text =
`Você recebeu uma nova mensagem de ${senderName}.

Conteúdo:
${messageText}

Acesse o chat para responder: ${chatLink}
`;

    const html =
`<p>Você recebeu uma nova mensagem de <strong>${senderName}</strong>.</p>
<p><strong>Conteúdo:</strong><br>${escapeHtml(messageText)}</p>
<p><a href="${chatLink}" target="_blank" rel="noopener noreferrer">Abrir chat</a></p>`;

    await sendEmail({
      to: recipientProfile.email,
      subject,
      text,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-message] Error", err);
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
