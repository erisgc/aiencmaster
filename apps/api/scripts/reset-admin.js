/**
 * Reset del módulo admin: borra TODAS las cuentas, dispositivos,
 * solicitudes de acceso, invitaciones y logs de auditoría.
 *
 * Después de correrlo, la API queda como recién instalada:
 * el siguiente acceso debe ir a /admin/bootstrap para crear el ROOT.
 *
 * Uso:
 *   node scripts/reset-admin.js
 *
 * Requiere ADMIN_BOOTSTRAP_ENABLED=true en el .env para que el cliente
 * pueda volver a generar la cuenta root tras el reset.
 */
const fs = require("node:fs");
const path = require("node:path");
const readline = require("node:readline");

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

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const { Client } = require(path.resolve(
    __dirname,
    "../node_modules/pg",
  ));

  const databaseUrl = process.env.DATABASE_URL?.trim();
  const client = databaseUrl
    ? new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
      })
    : new Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

  console.log(
    `\n⚠️  Vas a eliminar TODAS las cuentas administrativas, dispositivos,\n` +
      `   invitaciones y logs de auditoría de la base de datos:\n` +
      `   ${databaseUrl ? "(via DATABASE_URL)" : `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`}\n`,
  );

  const confirm = await ask(
    'Para continuar, escribe exactamente "RESET ADMIN": ',
  );
  if (confirm.trim() !== "RESET ADMIN") {
    console.log("Operación cancelada.");
    process.exit(0);
  }

  await client.connect();

  try {
    await client.query("BEGIN");

    // Orden importante por las FKs (resolvedByDeviceId, approvedByDeviceId, etc.):
    // 1) action logs
    // 2) access requests
    // 3) invitations
    // 4) devices
    // 5) accounts
    const queries = [
      'DELETE FROM "admin_action_logs"',
      'DELETE FROM "admin_access_requests"',
      'DELETE FROM "admin_invitations"',
      'DELETE FROM "admin_devices"',
      'DELETE FROM "admin_accounts"',
    ];

    for (const sql of queries) {
      const res = await client.query(sql);
      console.log(`✓ ${sql} → ${res.rowCount} filas`);
    }

    await client.query("COMMIT");
    console.log(
      "\n✅ Reset completo. El próximo acceso debe ir a /admin/bootstrap\n" +
        "   con el secret de ADMIN_BOOTSTRAP_SECRET para crear el nuevo ROOT.\n",
    );
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error durante el reset:", err.message ?? err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
