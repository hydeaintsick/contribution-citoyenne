import { NextResponse } from "next/server";
import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import { cloudinary, CLOUDINARY_FOLDER, isCloudinaryConfigured } from "@/lib/cloudinary";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1600;
const MAX_IMAGE_HEIGHT = 1600;

type CompressedImage = {
  buffer: Buffer;
  format: string;
};

function uploadBuffer(
  buffer: Buffer,
  filename: string,
  format: string,
): Promise<UploadApiResponse | UploadApiErrorResponse> {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_FOLDER,
        resource_type: "image",
        use_filename: Boolean(filename),
        unique_filename: true,
        overwrite: false,
        format,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary n’a retourné aucun résultat."));
          return;
        }
        resolve(result);
      },
    );

    upload.end(buffer);
  });
}

async function compressImage(
  buffer: Buffer,
  mimeType: string,
): Promise<CompressedImage> {
  try {
    const image = sharp(buffer, {
      failOnError: false,
      limitInputPixels: 80_000_000,
    }).rotate();

    const pipeline = image.resize({
      width: MAX_IMAGE_WIDTH,
      height: MAX_IMAGE_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    });

    const processedBuffer = await pipeline.webp({
      quality: 80,
      smartSubsample: true,
    }).toBuffer();

    return {
      buffer: processedBuffer,
      format: "webp",
    };
  } catch (error) {
    console.error("Image compression failed, falling back to original buffer", error);
    return {
      buffer,
      format: mimeType.split("/")[1] ?? "jpg",
    };
  }
}

export async function POST(request: Request) {
  if (!isCloudinaryConfigured) {
    return NextResponse.json(
      {
        error: "La configuration Cloudinary est absente.",
      },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier n’a été fourni." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Le fichier dépasse la taille maximale autorisée (5 Mo)." },
      { status: 413 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Seuls les fichiers images sont acceptés." },
      { status: 415 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const compressed = await compressImage(buffer, file.type);

    const sanitizedName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_");
    const uploadName = `${sanitizedName || "bug-report"}.${compressed.format}`;

    const result = await uploadBuffer(compressed.buffer, uploadName, compressed.format);

    if ("secure_url" in result) {
      return NextResponse.json(
        {
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
          width: result.width,
          height: result.height,
        },
        { status: 201 },
      );
    }

    throw new Error(result.error?.message ?? "Le téléversement a échoué.");
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue pendant le téléversement.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isCloudinaryConfigured) {
    return NextResponse.json(
      {
        error: "La configuration Cloudinary est absente.",
      },
      { status: 500 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Requête invalide : payload JSON requis." },
      { status: 400 },
    );
  }

  const publicId =
    typeof payload === "object" && payload !== null && "publicId" in payload
      ? (payload as { publicId: unknown }).publicId
      : null;

  if (typeof publicId !== "string" || publicId.length === 0) {
    return NextResponse.json(
      { error: "Champ publicId manquant ou invalide." },
      { status: 400 },
    );
  }

  if (!publicId.startsWith(`${CLOUDINARY_FOLDER}/`)) {
    return NextResponse.json(
      { error: "Suppression refusée pour cette ressource." },
      { status: 403 },
    );
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Cloudinary destroy failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la suppression.",
      },
      { status: 500 },
    );
  }
}


