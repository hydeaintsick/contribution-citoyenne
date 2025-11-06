import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const updateProfileSchema = z.object({
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .optional()
    .or(z.literal("")),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parseResult = updateProfileSchema.safeParse(json);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Données invalides." },
      { status: 400 },
    );
  }

  const { firstName, lastName, password } = parseResult.data;

  const updateData: {
    firstName?: string | null;
    lastName?: string | null;
    password?: string;
  } = {};

  if (firstName !== undefined) {
    updateData.firstName = firstName || null;
  }

  if (lastName !== undefined) {
    updateData.lastName = lastName || null;
  }

  if (password && password.length >= 8) {
    updateData.password = await hashPassword(password);
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  return NextResponse.json({ user: updatedUser });
}

