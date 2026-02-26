import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

function toDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export async function GET(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const from = toDate(searchParams.get('from'));
  const to = toDate(searchParams.get('to'));

  const movements = await prisma.cashBankMovement.findMany({
    where: {
      organizationId: orgId,
      ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return json(movements);
}

export async function POST(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  if (!body?.date || !body?.type || body?.amount === undefined || body?.amount === null) {
    return json({ error: 'date, type y amount son requeridos' }, { status: 400 });
  }

  const date = toDate(body.date);
  if (!date) return json({ error: 'date inválida' }, { status: 400 });

  const created = await prisma.cashBankMovement.create({
    data: {
      organizationId: orgId,
      date,
      type: body.type,
      account: body.account ?? 'caja',
      category: body.category ?? null,
      description: body.description ?? null,
      amount: String(body.amount),
      currency: body.currency ?? 'ARS',
      reference: body.reference ?? null,
      balance_after: body.balance_after !== undefined && body.balance_after !== null ? String(body.balance_after) : null,
      notes: body.notes ?? null,
    },
  });

  return json(created, { status: 201 });
}
