const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no está configurada en el servidor.');
  }

  const from = process.env.RESEND_FROM_EMAIL || 'QUMA Finance <onboarding@resend.dev>';

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Recuperar contraseña — QUMA Finance',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#0d9488;">Recuperar contraseña</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña en QUMA Finance.</p>
          <p>
            <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#0d9488;color:#fff;border-radius:6px;text-decoration:none;">
              Elegir nueva contraseña
            </a>
          </p>
          <p style="color:#64748b;font-size:13px;">Este link vence en 1 hora. Si no pediste esto, ignorá este email.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('Resend error:', res.status, errText);
    throw new Error('No se pudo enviar el email de recuperación.');
  }
}
