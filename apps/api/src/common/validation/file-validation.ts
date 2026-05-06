import { BadRequestException } from "@nestjs/common";

/**
 * Hard limits enforced at the application level, in addition to the
 * Fastify multipart global limit (50 MB in main.ts).
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_FILES_PER_ANNOUNCEMENT = 20;

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const ALLOWED_PDF_MIMES = new Set(["application/pdf"]);

/** Magic-byte signatures used to verify content matches the declared mime. */
const MAGIC_BYTES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF...WEBP
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
];

type Kind = "image" | "video" | "pdf";

function detectKind(mimetype: string): Kind | null {
  if (ALLOWED_IMAGE_MIMES.has(mimetype)) return "image";
  if (ALLOWED_VIDEO_MIMES.has(mimetype)) return "video";
  if (ALLOWED_PDF_MIMES.has(mimetype)) return "pdf";
  return null;
}

function verifyMagicBytes(buffer: Buffer, mimetype: string): boolean {
  // Videos don't have a simple universal magic check, we trust mime.
  if (mimetype.startsWith("video/")) return true;

  const matches = MAGIC_BYTES.filter((m) =>
    mimetype === "image/jpg" ? m.mime === "image/jpeg" : m.mime === mimetype,
  );
  if (matches.length === 0) {
    return true; // unknown mapping — let cloudinary handle it
  }
  return matches.some((m) => m.bytes.every((byte, i) => buffer[i] === byte));
}

export interface ValidatableFile {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

/**
 * Validate an uploaded file:
 * - MIME must be in an allow-list
 * - Size must not exceed the per-kind limit
 * - Magic bytes must match the declared mime (where applicable)
 */
export function validateUploadedFile(file: ValidatableFile): void {
  const kind = detectKind(file.mimetype);
  if (!kind) {
    throw new BadRequestException(
      `Tipo de archivo no permitido: ${file.mimetype}`,
    );
  }

  const size = file.buffer.byteLength;
  if (kind === "image" && size > MAX_IMAGE_BYTES) {
    throw new BadRequestException(
      `La imagen ${file.filename} excede el tamaño máximo (10 MB).`,
    );
  }
  if (kind === "video" && size > MAX_VIDEO_BYTES) {
    throw new BadRequestException(
      `El video ${file.filename} excede el tamaño máximo (50 MB).`,
    );
  }
  if (kind === "pdf" && size > MAX_PDF_BYTES) {
    throw new BadRequestException(
      `El PDF ${file.filename} excede el tamaño máximo (15 MB).`,
    );
  }

  if (!verifyMagicBytes(file.buffer, file.mimetype)) {
    throw new BadRequestException(
      `El archivo ${file.filename} no coincide con el tipo declarado.`,
    );
  }
}

export function validateUploadedFiles(files: ValidatableFile[]): void {
  if (files.length > MAX_FILES_PER_ANNOUNCEMENT) {
    throw new BadRequestException(
      `Máximo ${MAX_FILES_PER_ANNOUNCEMENT} archivos por anuncio.`,
    );
  }
  for (const f of files) {
    validateUploadedFile(f);
  }
}

/** For churches: only images are allowed for main/cover. */
export function validateChurchImage(file: ValidatableFile): void {
  const kind = detectKind(file.mimetype);
  if (kind !== "image") {
    throw new BadRequestException(
      `Solo se permiten imágenes para las iglesias (recibido: ${file.mimetype}).`,
    );
  }
  if (file.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new BadRequestException(
      `La imagen ${file.filename} excede el tamaño máximo (10 MB).`,
    );
  }
  if (!verifyMagicBytes(file.buffer, file.mimetype)) {
    throw new BadRequestException(
      `El archivo ${file.filename} no coincide con el tipo declarado.`,
    );
  }
}
