import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

function toDate(d) {
  if (!d) return null;
  // 'YYYY-MM-DD' is interpreted as UTC in JS.
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export async function GET(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const from = toDate(searchParams.get('from'));
  const to = toDate(searchParams.get('to'));

  const incomes = await prisma.income.findMany({
    where: {
      organizationId: orgId,
      ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return json(incomes);
}

export async function POST(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  if (!body?.date || body?.amount === undefined || body?.amount === null) {
    return json({ error: 'date y amount son requeridos' }, { status: 400 });
  }

  const date = toDate(body.date);
  if (!date) return json({ error: 'date inválida' }, { status: 400 });

  const created = await prisma.income.create({
    data: {
      organizationId: orgId,
      date,
      description: body.description ?? null,
      customer_name: body.customer_name ?? null,
      category: body.category ?? null,
      amount: String(body.amount),
      currency: body.currency ?? 'ARS',
      payment_method: body.payment_method ?? null,
      invoice_number: body.invoice_number ?? null,
      status: body.status ?? 'cobrado',
      estimated_date: toDate(body.estimated_date) ?? null,
      notes: body.notes ?? null,
    },
  });

  return json(created, { status: 201 });
}
