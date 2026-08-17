import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, email, name, role, organizationId } = session.user;

  // Shape plano (no envuelto en {user}) con organization_id en snake_case:
  // así lo consumen OrganizationContext.jsx y Layout.jsx.
  return NextResponse.json(
    { id, email, name, role, organizationId, organization_id: organizationId },
    { status: 200 }
  );
}
