import { NextResponse } from "next/server";
import { BugReportStatus, BugReportType, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const screenshotSchema = z.object({
  url: z.string().url(),
  publicId: z.string().trim().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().positive().optional(),
});

const bugReportSchema = z.object({
  type: z
    .enum(["BUG", "FEATURE", "FONCTIONNALITE"])
    .transform((value) => (value === "FONCTIONNALITE" ? "FEATURE" : value)),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().min(12).max(2000),
  screenshot: screenshotSchema.optional(),
});

type BugReportPayload = z.infer<typeof bugReportSchema>;

function mapBugReportType(value: BugReportPayload["type"]) {
  if (value === "BUG") {
    return BugReportType.BUG;
  }

  return BugReportType.FEATURE;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Payload JSON invalide." },
      { status: 400 }
    );
  }

  const parsed = bugReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Le formulaire est invalide.",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const bugReport = await prisma.bugReport.create({
      data: {
        type: mapBugReportType(data.type),
        title: data.title.trim(),
        description: data.description.trim(),
        status: BugReportStatus.TO_BE_QUALIFIED,
        screenshotUrl: data.screenshot?.url ?? null,
        screenshotPublicId: data.screenshot?.publicId ?? null,
        screenshotWidth: data.screenshot?.width ?? null,
        screenshotHeight: data.screenshot?.height ?? null,
        screenshotBytes: data.screenshot?.bytes ?? null,
      } as Prisma.BugReportCreateInput,
    });

    console.info("Bug report created", {
      bugReportId: bugReport.id,
      type: bugReport.type,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Merci pour votre participation.",
      },
      { status: 201 }
    );

    return response;
  } catch (error) {
    console.error("Bug report creation failed", error);

    const response = NextResponse.json(
      {
        error:
          "Le signalement n’a pas pu être enregistré. Merci de réessayer plus tard.",
      },
      { status: 500 }
    );

    return response;
  }
}
