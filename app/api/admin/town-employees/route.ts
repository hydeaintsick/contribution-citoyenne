import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createEmployeeSchema = z.object({
  email: z.string().email("Email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
});

function sanitizeEmployee(employee: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}) {
  return {
    id: employee.id,
    email: employee.email,
    firstName: employee.firstName,
    lastName: employee.lastName,
    createdAt: employee.createdAt.toISOString(),
    lastLoginAt: employee.lastLoginAt ? employee.lastLoginAt.toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || session.user.role !== "TOWN_MANAGER") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Aucune commune n’est associée à ce manager." },
      { status: 403 },
    );
  }

  const employees = await prisma.user.findMany({
    where: {
      communeId: session.user.communeId,
      role: "TOWN_EMPLOYEE",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    employees: employees.map(sanitizeEmployee),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || session.user.role !== "TOWN_MANAGER") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!session.user.communeId) {
    return NextResponse.json(
      { error: "Aucune commune n’est associée à ce manager." },
      { status: 403 },
    );
  }

  const json = await request.json().catch(() => null);

  const parseResult = createEmployeeSchema.safeParse(json);

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
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 },
    );
  }

  const hashedPassword = await hashPassword(password);

  const employee = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: "TOWN_EMPLOYEE",
      communeId: session.user.communeId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return NextResponse.json(
    {
      employee: sanitizeEmployee(employee),
    },
    { status: 201 },
  );
}

