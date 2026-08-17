import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { json, readJson } from '@/lib/api-helpers';

export async function POST(req) {
  const body = await readJson(req);
  const token = body?.token;
  const password = body?.password;

  if (!token || !password) {
    return json({ error: 'Faltan datos.' }, { status: 400 });
  }
  if (String(password).length < 8) {
    return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return json({ error: 'El link es inválido o expiró. Pedí uno nuevo.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return json({ ok: true });
}
