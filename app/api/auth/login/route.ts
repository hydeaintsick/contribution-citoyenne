import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, createSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);

  const parseResult = loginSchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Requête invalide." },
      { status: 400 },
    );
  }

  const { email, password } = parseResult.data;

  const ipAddressHeader = request.headers.get("x-forwarded-for");
  const ipAddress =
    ipAddressHeader?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const sessionUser = await authenticateUser(email, password, {
    ipAddress,
    userAgent,
  });
  if (!sessionUser) {
    return NextResponse.json(
      { error: "Identifiants invalides." },
      { status: 401 },
    );
  }

  const cookie = await createSession(sessionUser);
  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set(cookie.name, cookie.value, cookie.options);

  return response;
}

