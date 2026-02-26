import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

export async function GET(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  const categories = await prisma.category.findMany({
    where: {
      organizationId: orgId,
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  return json(categories);
}

export async function POST(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  if (!body?.name || !body?.type) {
    return json({ error: 'name y type son requeridos' }, { status: 400 });
  }

  const created = await prisma.category.create({
    data: {
      organizationId: orgId,
      name: body.name,
      type: body.type,
      description: body.description ?? null,
      color: body.color ?? 'slate',
      status: body.status ?? 'activa',
    },
  });

  return json(created, { status: 201 });
}
