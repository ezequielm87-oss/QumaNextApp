import { prisma } from '@/lib/prisma';
import { requireSession, json, readJson } from '@/lib/api-helpers';

function toDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export async function GET() {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const reports = await prisma.financialReport.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
  });

  return json(reports);
}

export async function POST(req) {
  const { orgId, response } = await requireSession();
  if (response) return response;

  const body = await readJson(req);
  if (!body?.title || !body?.type || !body?.content) {
    return json({ error: 'title, type y content son requeridos' }, { status: 400 });
  }

  const created = await prisma.financialReport.create({
    data: {
      organizationId: orgId,
      title: body.title,
      type: body.type,
      period_from: toDate(body.period_from),
      period_to: toDate(body.period_to),
      content: body.content,
      prompt_used: body.prompt_used ?? null,
    },
  });

  return json(created, { status: 201 });
}
