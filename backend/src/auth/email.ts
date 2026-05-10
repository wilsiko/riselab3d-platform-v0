import { Resend } from 'resend';

let resendClient: Resend | null | undefined;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  resendClient = apiKey ? new Resend(apiKey) : null;
  return resendClient;
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Verification email skipped for', to);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'RiseLab3D <onboarding@resend.dev>';

  await resend.emails.send({
    from,
    to,
    subject: 'Confirme seu e-mail na RiseLab3D',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
        <h1 style="font-size:22px;margin-bottom:12px;">Confirme seu e-mail</h1>
        <p style="line-height:1.6;margin-bottom:16px;">Use o link abaixo para ativar sua conta e liberar o salvamento de cotações, histórico e configurações.</p>
        <p style="margin-bottom:24px;"><a href="${verificationUrl}" style="display:inline-block;background:#22d3ee;color:#082f49;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700;">Confirmar e-mail</a></p>
        <p style="font-size:13px;line-height:1.6;color:#475569;">Se o botão não abrir, copie este endereço no navegador:</p>
        <p style="font-size:13px;line-height:1.6;color:#475569;word-break:break-word;">${verificationUrl}</p>
      </div>
    `,
  });
}
