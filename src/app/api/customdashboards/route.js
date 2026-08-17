import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

export async function GET() {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const dashboards = await prisma.customDashboard.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });

  return json(dashboards);
}

export async function POST(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  if (!body?.title || !body?.charts_config) {
    return json({ error: 'title y charts_config son requeridos' }, { status: 400 });
  }

  const created = await prisma.customDashboard.create({
    data: {
      organizationId: orgId,
      title: body.title,
      description: body.description ?? null,
      charts_config: body.charts_config,
      prompt_used: body.prompt_used ?? null,
    },
  });

  return json(created, { status: 201 });
}
