import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CityAuditAction } from "@prisma/client";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCommuneSlug } from "@/lib/slug";

const bboxSchema = z
  .array(z.union([z.number(), z.string().transform((value) => Number.parseFloat(value))]))
  .length(4)
  .transform((values) => values.map((value) => Number(value)));

const createCommuneSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Le code postal doit comporter 5 chiffres."),
  name: z.string().trim().min(1, "Le nom de la commune est requis."),
  osmId: z.string().trim().min(1, "Identifiant OSM manquant."),
  osmType: z.string().trim().min(1, "Type OSM manquant."),
  bbox: bboxSchema,
  latitude: z.union([
    z.number(),
    z.string().trim().transform((value) => Number.parseFloat(value)),
  ]),
  longitude: z.union([
    z.number(),
    z.string().trim().transform((value) => Number.parseFloat(value)),
  ]),
  websiteUrl: z
    .union([
      z.string().trim().length(0),
      z.string().trim().url("L’URL du site doit être valide."),
    ])
    .optional()
    .transform((value) => {
      if (!value || value.length === 0) {
        return undefined;
      }
      return value;
    }),
  manager: z.object({
    email: z.string().email("Email du manager invalide."),
    password: z
      .string()
      .min(8, "Le mot de passe du manager doit contenir au moins 8 caractères."),
    firstName: z.string().trim().min(1, "Prénom requis."),
    lastName: z.string().trim().min(1, "Nom requis."),
    phone: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === "" ? undefined : value)),
  }),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const communes = await prisma.commune.findMany({
      select: {
        id: true,
        name: true,
        postalCode: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ communes });
  } catch (error) {
    console.error("Failed to fetch communes", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les communes pour le moment." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_MANAGER")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json(
      { error: "Veuillez fournir les informations de la commune." },
      { status: 400 },
    );
  }

  const parseResult = createCommuneSchema.safeParse(json);

  if (!parseResult.success) {
    const message = parseResult.error.issues[0]?.message ?? "Données invalides.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const {
    postalCode,
    name,
    osmId,
    osmType,
    bbox,
    latitude,
    longitude,
    websiteUrl,
    manager,
  } = parseResult.data;

  if ([latitude, longitude].some((value) => Number.isNaN(value))) {
    return NextResponse.json(
      { error: "Les coordonnées géographiques sont invalides." },
      { status: 400 },
    );
  }

  const [south, north, west, east] = bbox;
  if ([south, north, west, east].some((value) => Number.isNaN(value))) {
    return NextResponse.json(
      { error: "La zone géographique de la commune est invalide." },
      { status: 400 },
    );
  }

  try {
    const existingCommune = await prisma.commune.findFirst({
      where: {
        OR: [{ postalCode }, { osmId }],
      },
      select: { id: true, name: true, postalCode: true },
    });

    if (existingCommune) {
      return NextResponse.json(
        {
          error: `La commune ${existingCommune.name} (${existingCommune.postalCode}) est déjà enregistrée.`,
        },
        { status: 409 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: manager.email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte utilise déjà cet email." },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(manager.password);

    const slug = generateCommuneSlug(name, postalCode);

    const { commune: createdCommune } = await prisma.$transaction(async (tx) => {
      const commune = await tx.commune.create({
        data: {
          name,
          slug,
          postalCode,
          osmId,
          osmType,
          bbox,
          latitude,
          longitude,
          websiteUrl,
          createdById: session.user.id,
          updatedById: session.user.id,
        },
      });

      await tx.user.create({
        data: {
          email: manager.email,
          password: hashedPassword,
          firstName: manager.firstName,
          lastName: manager.lastName,
          phone: manager.phone,
          role: "TOWN_MANAGER",
          communeId: commune.id,
        },
      });

      await tx.cityAuditLog.create({
        data: {
          communeId: commune.id,
          userId: session.user.id,
          action: CityAuditAction.CREATED,
          details: {
            managerEmail: manager.email,
            postalCode,
          },
        },
      });

      return { commune };
    });

    return NextResponse.json(
      {
        commune: {
          id: createdCommune.id,
          name: createdCommune.name,
          slug: createdCommune.slug,
          postalCode: createdCommune.postalCode,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Commune creation failed", error);
    return NextResponse.json(
      {
        error: "La création de la commune est impossible pour le moment.",
      },
      { status: 500 },
    );
  }
}

