import { NextResponse } from "next/server";
import { z } from "zod";

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

  console.info("Citizen report queued", {
    communeId: payload.communeId,
    type: payload.type,
    category: payload.category.value,
    subcategory: payload.subcategory,
    hasPhoto: Boolean(payload.photo),
  });

  // TODO: Persist payload in database or forward to the appropriate workflow.

  return NextResponse.json(
    {
      success: true,
      message: "Signalement enregistré. Merci pour votre contribution.",
    },
    { status: 202 },
  );
}


