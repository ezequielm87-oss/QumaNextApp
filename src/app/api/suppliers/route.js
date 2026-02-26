import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

export async function GET() {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: orgId },
    orderBy: [{ name: 'asc' }],
  });
  return json(suppliers);
}

export async function POST(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  if (!body?.name) return json({ error: 'name requerido' }, { status: 400 });

  const created = await prisma.supplier.create({
    data: {
      organizationId: orgId,
      name: body.name,
      tax_id: body.tax_id ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      category: body.category ?? null,
      status: body.status ?? 'activo',
      notes: body.notes ?? null,
    },
  });

  return json(created, { status: 201 });
}
