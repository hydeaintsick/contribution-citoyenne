import { NextRequest, NextResponse } from "next/server";
import { BugReportStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

const updateSchema = z.object({
  status: z.nativeEnum(BugReportStatus),
});

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

  const { status } = parsed.data;

  try {
    const bugReport = await prisma.bugReport.update({
      where: { id },
      data: {
        status,
        resolvedAt:
          status === BugReportStatus.DEPLOYED || status === BugReportStatus.DONE
            ? new Date()
            : null,
      },
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


