import { prisma } from '@/lib/prisma';
import { requireSession, json } from '@/lib/api-helpers';

export async function GET() {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  return json(org ? [org] : []);
}
