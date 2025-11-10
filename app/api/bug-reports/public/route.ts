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
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      githubCommitUrl: true,
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
      githubCommitUrl: bugReport.githubCommitUrl,
    })),
  });
}


