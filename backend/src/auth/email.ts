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

async function sendEmailOrThrow(
  resend: Resend,
  payload: Parameters<typeof resend.emails.send>[0],
) {
  const result = await resend.emails.send(payload);

  if ('error' in result && result.error) {
    throw new Error(result.error.message || 'Email delivery failed.');
  }

  return result;
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Verification email skipped for', to);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'RiseLab3D <onboarding@resend.dev>';

  await sendEmailOrThrow(resend, {
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

export async function sendTemporaryPasswordEmail(to: string, temporaryPassword: string) {
  const resend = getResendClient();

  if (!resend) {
    console.warn('RESEND_API_KEY not configured. Temporary password email skipped for', to);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'RiseLab3D <onboarding@resend.dev>';

  await sendEmailOrThrow(resend, {
    from,
    to,
    subject: 'Sua senha temporaria da RiseLab3D',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a;">
        <h1 style="font-size:22px;margin-bottom:12px;">Senha temporaria solicitada</h1>
        <p style="line-height:1.6;margin-bottom:16px;">Recebemos um pedido de redefinicao de senha para a sua conta. Use a senha temporaria abaixo para entrar.</p>
        <div style="margin:0 0 20px 0;padding:14px 16px;border-radius:14px;background:#082f49;color:#ecfeff;font-size:22px;font-weight:700;letter-spacing:0.08em;text-align:center;">${temporaryPassword}</div>
        <p style="line-height:1.6;margin-bottom:16px;">No primeiro acesso, a plataforma vai exigir a definicao de uma nova senha antes de continuar.</p>
        <p style="font-size:13px;line-height:1.6;color:#475569;">Se voce nao solicitou esta redefinicao, entre em contato com o suporte e descarte esta mensagem.</p>
      </div>
    `,
  });
}

export async function sendInstitutionalContactEmail(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const resend = getResendClient();

  if (!resend) {
    throw new Error('RESEND_API_KEY not configured for institutional contact form.');
  }

  const from = process.env.RESEND_FROM_EMAIL || 'RiseLab3D <onboarding@resend.dev>';
  const to = process.env.CONTACT_FORM_TO_EMAIL || 'contato@riselab3d.com.br';

  await sendEmailOrThrow(resend, {
    from,
    to,
    replyTo: input.email,
    subject: `Novo contato pelo site institucional - ${input.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;">
        <h1 style="font-size:24px;margin:0 0 16px;">Novo contato pelo site institucional</h1>
        <div style="border:1px solid #e2e8f0;border-radius:16px;padding:20px;background:#f8fafc;">
          <p style="margin:0 0 12px;"><strong>Nome:</strong> ${input.name}</p>
          <p style="margin:0 0 12px;"><strong>E-mail:</strong> ${input.email}</p>
          <p style="margin:0 0 12px;"><strong>Telefone:</strong> ${input.phone}</p>
          <p style="margin:0;"><strong>Mensagem:</strong></p>
          <p style="margin:8px 0 0;line-height:1.7;white-space:pre-wrap;">${input.message}</p>
        </div>
      </div>
    `,
  });
}
