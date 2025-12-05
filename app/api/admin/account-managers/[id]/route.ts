import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const updateAccountManagerSchema = z.object({
  email: z.string().email("Email invalide.").optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .optional()
    .or(z.literal("")),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  role: z.enum(["ADMIN", "ACCOUNT_MANAGER"]).optional(),
});

function sanitizeAccountManager(accountManager: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}) {
  return {
    id: accountManager.id,
    email: accountManager.email,
    firstName: accountManager.firstName,
    lastName: accountManager.lastName,
    role: accountManager.role,
    createdAt: accountManager.createdAt.toISOString(),
    updatedAt: accountManager.updatedAt.toISOString(),
    lastLoginAt: accountManager.lastLoginAt
      ? accountManager.lastLoginAt.toISOString()
      : null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  const accountManager = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  if (!accountManager) {
    return NextResponse.json(
      { error: "Chargé de compte introuvable." },
      { status: 404 },
    );
  }

  // Vérifier que c'est bien un account manager ou admin
  if (
    accountManager.role !== "ACCOUNT_MANAGER" &&
    accountManager.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Cet utilisateur n'est pas un chargé de compte ou admin." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    accountManager: sanitizeAccountManager(accountManager),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(request);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  // Vérifier que l'utilisateur existe et est un account manager ou admin
  const existingUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      email: true,
    },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: "Chargé de compte introuvable." },
      { status: 404 },
    );
  }

  if (
    existingUser.role !== "ACCOUNT_MANAGER" &&
    existingUser.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Cet utilisateur n'est pas un chargé de compte ou admin." },
      { status: 403 },
    );
  }

  const json = await request.json().catch(() => null);
  const parseResult = updateAccountManagerSchema.safeParse(json);

  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password, firstName, lastName, role } = parseResult.data;

  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (email && email !== existingUser.email) {
    const emailUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailUser) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà." },
        { status: 409 },
      );
    }
  }

  const updateData: {
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    role?: Role;
    password?: string;
  } = {};

  if (email !== undefined) {
    updateData.email = email;
  }

  if (firstName !== undefined) {
    updateData.firstName = firstName || null;
  }

  if (lastName !== undefined) {
    updateData.lastName = lastName || null;
  }

  if (role !== undefined) {
    updateData.role = role;
  }

  if (password && password.length >= 8) {
    updateData.password = await hashPassword(password);
  }

  const updatedAccountManager = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      lastLoginAt: true,
    },
  });

  return NextResponse.json({
    accountManager: sanitizeAccountManager(updatedAccountManager),
  });
}

