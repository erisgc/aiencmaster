/**
 * Sube un PDF a Cloudinary y emite el SQL listo para insertar el
 * anuncio (con su attachment) en la base de datos de Neon.
 *
 * Uso:
 *   node scripts/upload-pdf-and-sql.js <ruta-al-pdf> "<titulo>" "<autor>"
 *
 * Ejemplo:
 *   node scripts/upload-pdf-and-sql.js \
 *     "C:/Users/Ruben Gutierrez/Downloads/Fechas informes DIAN.pdf" \
 *     "Fechas informes DIAN" \
 *     "Einer Gutierrez"
 */
const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(__dirname, "../.env"));

async function main() {
  const [, , filePath, title, author] = process.argv;
  if (!filePath || !title || !author) {
    console.error(
      "Uso: node upload-pdf-and-sql.js <ruta-al-pdf> <titulo> <autor>",
    );
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`No existe: ${filePath}`);
    process.exit(1);
  }

  const cloudinary = require(
    path.resolve(__dirname, "../node_modules/cloudinary"),
  ).v2;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  console.log(`Subiendo "${path.basename(filePath)}" a Cloudinary…`);

  const result = await cloudinary.uploader.upload(filePath, {
    folder: "announcements",
    resource_type: "auto",
    access_mode: "public",
    use_filename: true,
    unique_filename: true,
  });

  console.log("\n✅ Subida correcta:");
  console.log(`   public_id:     ${result.public_id}`);
  console.log(`   secure_url:    ${result.secure_url}`);
  console.log(`   resource_type: ${result.resource_type}`);
  console.log(`   format:        ${result.format}`);
  console.log(`   bytes:         ${result.bytes}`);

  const original_filename =
    result.original_filename ||
    path.basename(filePath, path.extname(filePath));

  // Sanitizamos comillas para el SQL.
  const esc = (s) => String(s).replace(/'/g, "''");

  const announcementId = `gen_random_uuid()`;
  const attachmentId = `gen_random_uuid()`;

  const sql = `
-- ══════════════════════════════════════════════════════════════
-- Inserción del anuncio "${title}"
-- Autor: ${author}
-- Adjunto subido a Cloudinary: ${result.secure_url}
-- ══════════════════════════════════════════════════════════════

WITH new_announcement AS (
  INSERT INTO announcements (id, title, description, author, "createdAt")
  VALUES (
    ${announcementId},
    '${esc(title)}',
    '${esc(title)}',
    '${esc(author)}',
    NOW()
  )
  RETURNING id
)
INSERT INTO announcement_attachments (id, "publicId", url, "resourceType", format, name, size, "announcementId")
SELECT
  ${attachmentId},
  '${esc(result.public_id)}',
  '${esc(result.secure_url)}',
  '${esc(result.resource_type)}',
  '${esc(result.format)}',
  '${esc(original_filename)}',
  ${result.bytes},
  id
FROM new_announcement;
`.trim();

  console.log("\n📋 SQL listo para pegar en Neon SQL Editor:\n");
  console.log("─".repeat(70));
  console.log(sql);
  console.log("─".repeat(70));
  console.log(
    "\nCopia ese bloque y pégalo en console.neon.tech → SQL Editor → Run.\n",
  );
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message ?? err);
  process.exit(1);
});
