import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

export async function PUT(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  const existing = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  const body = await readJson(req);
  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      name: body?.name ?? existing.name,
      tax_id: body?.tax_id ?? existing.tax_id,
      email: body?.email ?? existing.email,
      phone: body?.phone ?? existing.phone,
      category: body?.category ?? existing.category,
      status: body?.status ?? existing.status,
      notes: body?.notes ?? existing.notes,
    },
  });

  return json(updated);
}

export async function DELETE(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  const existing = await prisma.supplier.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  await prisma.supplier.delete({ where: { id } });
  return json({ ok: true });
}
