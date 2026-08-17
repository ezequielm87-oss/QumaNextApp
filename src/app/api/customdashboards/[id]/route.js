import { prisma } from '@/lib/prisma';
import { requireSession, json } from '@/lib/api-helpers';

export async function DELETE(req, { params }) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const id = params.id;
  const existing = await prisma.customDashboard.findFirst({ where: { id, organizationId: orgId } });
  if (!existing) return json({ error: 'Not found' }, { status: 404 });

  await prisma.customDashboard.delete({ where: { id } });
  return json({ ok: true });
}
