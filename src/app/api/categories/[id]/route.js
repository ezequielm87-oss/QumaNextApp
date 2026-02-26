import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

export async function PUT(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  const id = params.id;

  // Ensure ownership
  const existing = await prisma.category.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: body?.name ?? existing.name,
      type: body?.type ?? existing.type,
      description: body?.description ?? existing.description,
      color: body?.color ?? existing.color,
      status: body?.status ?? existing.status,
    },
  });

  return json(updated);
}

export async function DELETE(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  const existing = await prisma.category.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  await prisma.category.delete({ where: { id } });
  return json({ ok: true });
}
