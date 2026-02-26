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
  const existing = await prisma.cashBankMovement.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  const body = await readJson(req);
  const updated = await prisma.cashBankMovement.update({
    where: { id },
    data: {
      date: toDate(body?.date) ?? existing.date,
      type: body?.type ?? existing.type,
      account: body?.account ?? existing.account,
      category: body?.category ?? existing.category,
      description: body?.description ?? existing.description,
      amount: body?.amount !== undefined && body?.amount !== null ? String(body.amount) : existing.amount,
      currency: body?.currency ?? existing.currency,
      reference: body?.reference ?? existing.reference,
      balance_after:
        body?.balance_after !== undefined && body?.balance_after !== null
          ? String(body.balance_after)
          : existing.balance_after,
      notes: body?.notes ?? existing.notes,
    },
  });

  return json(updated);
}

export async function DELETE(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  const existing = await prisma.cashBankMovement.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  await prisma.cashBankMovement.delete({ where: { id } });
  return json({ ok: true });
}
