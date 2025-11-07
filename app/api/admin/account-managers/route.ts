import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createAccountManagerSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
});

function sanitizeAccountManager(accountManager: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}) {
  return {
    id: accountManager.id,
    email: accountManager.email,
    firstName: accountManager.firstName,
    lastName: accountManager.lastName,
    createdAt: accountManager.createdAt.toISOString(),
    updatedAt: accountManager.updatedAt.toISOString(),
    lastLoginAt: accountManager.lastLoginAt
      ? accountManager.lastLoginAt.toISOString()
      : null,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const accountManagers = await prisma.user.findMany({
    where: {
      role: "ACCOUNT_MANAGER",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    accountManagers: accountManagers.map(sanitizeAccountManager),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);

  const parseResult = createAccountManagerSchema.safeParse(json);
  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password, firstName, lastName } = parseResult.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Un compte avec cet email existe déjà." },
      { status: 409 },
    );
  }

  const hashedPassword = await hashPassword(password);

  const accountManager = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "ACCOUNT_MANAGER",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  return NextResponse.json(
    {
      accountManager: sanitizeAccountManager(accountManager),
    },
    { status: 201 },
  );
}


