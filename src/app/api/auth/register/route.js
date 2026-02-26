import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { defaultCategories } from '@/lib/default-categories';

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body.email || '').toLowerCase().trim();
    const password = String(body.password || '');
    const orgName = String(body.organizationName || '').trim();
    const name = String(body.name || '').trim() || null;

    if (!email || !password || !orgName) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Ese email ya está registrado.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          email,
          status: 'activa',
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'admin',
          organizationId: org.id,
        },
      });

      // Seed default categories for this organization
      await tx.category.createMany({
        data: defaultCategories.map((c) => ({
          organizationId: org.id,
          name: c.name,
          type: c.type,
          description: c.description,
          color: c.color,
          status: c.status,
        })),
        skipDuplicates: true,
      });

      return { userId: user.id, organizationId: org.id };
    });

    return NextResponse.json({ ok: true, ...created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error inesperado.' }, { status: 500 });
  }
}
