// Lightweight SMTP client for Supabase Edge Functions (Deno)
// Uses environment variables provided by Supabase custom SMTP settings

import { Client } from "https://deno.land/x/smtp@v0.8.0/mod.ts";

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

// Sends an email using SMTP credentials from env vars
export async function sendEmail(payload: EmailPayload) {
  const host = Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") ?? 587);
  const username = Deno.env.get("SMTP_USERNAME");
  const password = Deno.env.get("SMTP_PASSWORD");
  const fromEmail = Deno.env.get("SMTP_SENDER_EMAIL");
  const fromName = Deno.env.get("SMTP_SENDER_NAME") ?? "Recover";

  if (!host || !username || !password || !fromEmail) {
    console.error("[emailClient] Missing SMTP env vars");
    throw new Error("SMTP configuration is incomplete");
  }

  const client = new Client();

  // Connect with TLS (recommended for 465) or STARTTLS (587)
  await client.connect({
    hostname: host,
    port,
    username,
    password,
    // Try TLS first; if the provider requires STARTTLS, SMTP library will negotiate
    tls: true,
  });

  const from = `${fromName} <${fromEmail}>`;

  await client.send({
    from,
    to: payload.to,
    subject: payload.subject,
    content: payload.text,
    html: payload.html,
  });

  await client.close();
}
