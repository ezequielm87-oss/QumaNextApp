import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Respuesta JSON estándar
export function json(data, init = {}) {
  return NextResponse.json(data, init);
}

// Lee JSON del body (y devuelve error 400 si viene mal)
export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

// Requiere sesión y devuelve organizationId (1 usuario = 1 org)
export async function requireSession() {
  const session = await getServerSession(authOptions);

  const orgId = session?.user?.organizationId;
  if (!orgId) {
    return {
      session: null,
      orgId: null,
      response: json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, orgId, response: null };
}