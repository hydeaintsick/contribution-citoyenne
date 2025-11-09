import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PUBLIC_BUG_REPORT_STATUSES } from "@/lib/bugReports";

export const runtime = "nodejs";

export async function GET() {
  const bugReports = await prisma.bugReport.findMany({
    where: {
      status: {
        in: PUBLIC_BUG_REPORT_STATUSES,
      },
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
      resolvedAt: bugReport.resolvedAt
        ? bugReport.resolvedAt.toISOString()
        : null,
      screenshotUrl: bugReport.screenshotUrl,
      screenshotWidth: bugReport.screenshotWidth,
      screenshotHeight: bugReport.screenshotHeight,
      screenshotBytes: bugReport.screenshotBytes,
    })),
  });
}


