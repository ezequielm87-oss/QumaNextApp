import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

export async function PUT(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  if (id !== orgId) return json({ error: 'Forbidden' }, { status: 403 });

  const body = await readJson(req);
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.organization.update({
    where: { id },
    data: {
      name: body?.name ?? existing.name,
      tax_id: body?.tax_id ?? existing.tax_id,
      address: body?.address ?? existing.address,
      phone: body?.phone ?? existing.phone,
      email: body?.email ?? existing.email,
      status: body?.status ?? existing.status,
    },
  });

  return json(updated);
}
