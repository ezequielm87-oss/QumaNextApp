import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { json, readJson } from '@/lib/api-helpers';
import { sendPasswordResetEmail } from '@/lib/email';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export async function POST(req) {
  const body = await readJson(req);
  const email = String(body?.email || '').toLowerCase().trim();

  // Respuesta genérica siempre igual: evita que se pueda averiguar
  // qué emails están registrados probando este endpoint.
  const genericResponse = json({
    ok: true,
    message: 'Si el email está registrado, vas a recibir un link para recuperar tu contraseña.',
  });

  if (!email) return genericResponse;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  try {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  } catch (err) {
    console.error('forgot-password error:', err);
  }

  return genericResponse;
}
