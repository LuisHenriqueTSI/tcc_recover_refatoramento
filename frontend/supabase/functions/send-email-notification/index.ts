import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

interface EmailRequest {
  notificationId: string
  userEmail: string
  title: string
  message: string
  type: string
  createdAt: string
}

const getEmailTemplate = (title: string, message: string, type: string) => {
  const templates: { [key: string]: (title: string, message: string) => string } = {
    sighting: (title, message) => `
      <h2>${title}</h2>
      <p>${message}</p>
      <p>Acesse a plataforma para ver mais detalhes sobre o avistamento.</p>
    `,
    message: (title, message) => `
      <h2>${title}</h2>
      <p>${message}</p>
      <p>Acesse o chat da plataforma para responder a mensagem.</p>
    `,
    reward_claim: (title, message) => `
      <h2>${title}</h2>
      <p>${message}</p>
      <p>Acesse a plataforma para analisar a reclamação de recompensa.</p>
    `,
    default: (title, message) => `
      <h2>${title}</h2>
      <p>${message}</p>
    `,
  }

  const template = templates[type] || templates.default
  return template(title, message)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Content-Type": "application/json" } })
  }

  try {
    const { notificationId, userEmail, title, message, type, createdAt }: EmailRequest = await req.json()

    const emailBody = getEmailTemplate(title, message, type)

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "noreply@tcc-recover.com",
        to: userEmail,
        subject: `[TCC Recover] ${title}`,
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4CAF50;">TCC Recover</h1>
                <hr style="border: none; border-top: 1px solid #ddd;" />
                
                ${emailBody}
                
                <hr style="border: none; border-top: 1px solid #ddd; margin-top: 30px;" />
                <p style="color: #999; font-size: 12px;">
                  Esta é uma notificação automática. Não responda este email.
                </p>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const emailData = await response.json()

    if (!response.ok) {
      console.error("Erro ao enviar email:", emailData)
      return new Response(JSON.stringify({ error: emailData }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado com sucesso",
        emailId: emailData.id,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Erro em send-email-notification:", error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    )
  }
})
