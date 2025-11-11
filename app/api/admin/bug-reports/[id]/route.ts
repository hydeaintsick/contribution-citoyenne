import { NextRequest, NextResponse } from "next/server";
import { BugReportStatus, BugReportType, Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

const updateSchema = z
  .object({
    status: z.nativeEnum(BugReportStatus).optional(),
    type: z.nativeEnum(BugReportType).optional(),
    title: z
      .string()
      .trim()
      .min(1, "Le titre ne peut pas être vide.")
      .max(200, "Le titre ne peut pas dépasser 200 caractères.")
      .optional(),
    description: z
      .string()
      .trim()
      .min(1, "La description ne peut pas être vide.")
      .max(5000, "La description ne peut pas dépasser 5000 caractères.")
      .optional(),
    githubCommitUrl: z.string().trim().optional().or(z.literal(null)),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.type !== undefined ||
      data.title !== undefined ||
      data.description !== undefined ||
      data.githubCommitUrl !== undefined,
    {
      message:
        "Aucun champ à mettre à jour. Fournissez au moins un champ dans la requête.",
      path: [],
    },
  );

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSessionFromRequest(request);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);

  if (!json) {
    return NextResponse.json({ error: "Payload requis." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Statut invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    status,
    type,
    title,
    description,
    githubCommitUrl: rawGithubCommitUrl,
  } = parsed.data;

  let githubCommitUrl: string | null = null;
  const normalizedGithubCommitUrl =
    typeof rawGithubCommitUrl === "string"
      ? rawGithubCommitUrl.trim()
      : rawGithubCommitUrl === null
        ? null
        : undefined;

  if (typeof normalizedGithubCommitUrl === "string" && normalizedGithubCommitUrl.length > 0) {
    try {
      const url = new URL(normalizedGithubCommitUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Le lien doit commencer par http:// ou https://.");
      }
      githubCommitUrl = url.toString();
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Lien de commit GitHub invalide.",
        },
        { status: 400 },
      );
    }
  } else if (normalizedGithubCommitUrl === null) {
    githubCommitUrl = null;
  }

  const updateData: Prisma.BugReportUpdateInput = {};

  if (typeof title === "string") {
    updateData.title = title;
  }

  if (typeof description === "string") {
    updateData.description = description;
  }

  if (typeof type !== "undefined") {
    updateData.type = type;
  }

  if (typeof status !== "undefined") {
    updateData.status = status;
    updateData.resolvedAt =
      status === BugReportStatus.DEPLOYED || status === BugReportStatus.DONE
        ? new Date()
        : null;
    updateData.githubCommitUrl =
      status === BugReportStatus.DONE ? githubCommitUrl : null;
  } else if (githubCommitUrl !== null) {
    updateData.githubCommitUrl = githubCommitUrl;
  } else if (normalizedGithubCommitUrl === null) {
    updateData.githubCommitUrl = null;
  }

  try {
    const bugReport = await prisma.bugReport.update({
      where: { id },
      data: updateData,
    });

    console.info("Bug report updated", {
      bugReportId: bugReport.id,
      status: bugReport.status,
    });

    return NextResponse.json({
      bugReport: {
        id: bugReport.id,
        type: bugReport.type,
        status: bugReport.status,
        title: bugReport.title,
        description: bugReport.description,
        createdAt: bugReport.createdAt.toISOString(),
        updatedAt: bugReport.updatedAt.toISOString(),
        resolvedAt: bugReport.resolvedAt
          ? bugReport.resolvedAt.toISOString()
          : null,
        screenshotUrl: bugReport.screenshotUrl,
        screenshotPublicId: bugReport.screenshotPublicId,
        screenshotWidth: bugReport.screenshotWidth,
        screenshotHeight: bugReport.screenshotHeight,
        screenshotBytes: bugReport.screenshotBytes,
        githubCommitUrl: bugReport.githubCommitUrl,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json(
        { error: "Signalement introuvable." },
        { status: 404 },
      );
    }

    console.error("Bug report update failed", error);
    return NextResponse.json(
      { error: "La mise à jour du statut a échoué." },
      { status: 500 },
    );
  }
}


