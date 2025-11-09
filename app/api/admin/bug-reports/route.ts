import { NextRequest, NextResponse } from "next/server";
import { BugReportStatus, BugReportType } from "@prisma/client";
import { getSessionFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["ADMIN", "ACCOUNT_MANAGER"]);

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session || !ADMIN_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;

  const allowedTypes = new Set(Object.values(BugReportType));
  const allowedStatuses = new Set(Object.values(BugReportStatus));

  const typeFilters = searchParams
    .getAll("type")
    .map((value) => value.toUpperCase())
    .map((value) => (value === "FONCTIONNALITE" ? "FEATURE" : value))
    .filter((value): value is BugReportType => allowedTypes.has(value as BugReportType));

  const statusFilters = searchParams
    .getAll("status")
    .map((value) => value.toUpperCase())
    .filter((value): value is BugReportStatus =>
      allowedStatuses.has(value as BugReportStatus),
    );

  const bugReports = await prisma.bugReport.findMany({
    where: {
      ...(typeFilters.length > 0
        ? {
            type: {
              in: typeFilters,
            },
          }
        : {}),
      ...(statusFilters.length > 0
        ? {
            status: {
              in: statusFilters,
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    bugReports: bugReports.map((bugReport) => ({
      id: bugReport.id,
      type: bugReport.type,
      status: bugReport.status,
      title: bugReport.title,
      description: bugReport.description,
      createdAt: bugReport.createdAt.toISOString(),
      updatedAt: bugReport.updatedAt.toISOString(),
      resolvedAt: bugReport.resolvedAt ? bugReport.resolvedAt.toISOString() : null,
      screenshotUrl: bugReport.screenshotUrl,
      screenshotPublicId: bugReport.screenshotPublicId,
      screenshotWidth: bugReport.screenshotWidth,
      screenshotHeight: bugReport.screenshotHeight,
      screenshotBytes: bugReport.screenshotBytes,
    })),
  });
}


