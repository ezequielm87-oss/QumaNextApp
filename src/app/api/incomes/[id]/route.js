import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

function toDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export async function PUT(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  const existing = await prisma.income.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  const body = await readJson(req);
  const updated = await prisma.income.update({
    where: { id },
    data: {
      date: toDate(body?.date) ?? existing.date,
      description: body?.description ?? existing.description,
      customer_name: body?.customer_name ?? existing.customer_name,
      category: body?.category ?? existing.category,
      amount: body?.amount !== undefined && body?.amount !== null ? String(body.amount) : existing.amount,
      currency: body?.currency ?? existing.currency,
      payment_method: body?.payment_method ?? existing.payment_method,
      invoice_number: body?.invoice_number ?? existing.invoice_number,
      status: body?.status ?? existing.status,
      estimated_date: body?.estimated_date ? (toDate(body.estimated_date) ?? existing.estimated_date) : existing.estimated_date,
      notes: body?.notes ?? existing.notes,
    },
  });

  return json(updated);
}

export async function DELETE(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  const existing = await prisma.income.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  await prisma.income.delete({ where: { id } });
  return json({ ok: true });
}
