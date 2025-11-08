import { NextResponse } from "next/server";
import { z } from "zod";
import { ContributionStatus, ContributionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const reportSchema = z.object({
  communeId: z.string().min(1),
  type: z.enum(["alert", "suggestion"]),
  category: z.object({
    value: z.string().min(1),
    label: z.string().min(1),
  }),
  subcategory: z.string().min(1),
  details: z.string().min(12),
  location: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  photo: z
    .object({
      url: z.string().url(),
      publicId: z.string().min(1),
    })
    .optional()
    .nullable(),
  coordinates: z
    .object({
      latitude: z.number().finite(),
      longitude: z.number().finite(),
    })
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalide.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    const commune = await prisma.commune.findUnique({
      where: {
        id: payload.communeId,
      },
      select: {
        id: true,
        isVisible: true,
      },
    });

    if (!commune || !commune.isVisible) {
      return NextResponse.json(
        { error: "Commune introuvable ou indisponible." },
        { status: 404 },
      );
    }

    const contribution = await prisma.contribution.create({
      data: {
        communeId: commune.id,
        type:
          payload.type === "alert"
            ? ContributionType.ALERT
            : ContributionType.SUGGESTION,
        status: ContributionStatus.OPEN,
        categoryValue: payload.category.value,
        categoryLabel: payload.category.label,
        subcategory: payload.subcategory,
        details: payload.details.trim(),
        locationLabel: payload.location ?? null,
        latitude: payload.coordinates?.latitude ?? null,
        longitude: payload.coordinates?.longitude ?? null,
        photoUrl: payload.photo?.url ?? null,
        photoPublicId: payload.photo?.publicId ?? null,
      },
    });

    console.info("Citizen report recorded", {
      contributionId: contribution.id,
      communeId: commune.id,
      type: contribution.type,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Signalement enregistré. Merci pour votre contribution.",
        contribution: {
          id: contribution.id,
          communeId: contribution.communeId,
          type: contribution.type,
          status: contribution.status,
          categoryValue: contribution.categoryValue,
          categoryLabel: contribution.categoryLabel,
          subcategory: contribution.subcategory,
          locationLabel: contribution.locationLabel,
          latitude: contribution.latitude,
          longitude: contribution.longitude,
          createdAt: contribution.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Citizen report persistence failed", error);
    return NextResponse.json(
      {
        error:
          "L’enregistrement de votre remontée est impossible pour le moment. Merci de réessayer plus tard.",
      },
      { status: 500 },
    );
  }
}


