import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [database] = await prisma.$queryRaw<Array<{ database: string; user_name: string; version: string }>>`
    SELECT current_database() AS database, current_user AS user_name, version() AS version
  `;
  const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log(JSON.stringify({
    connected: true,
    database: database.database,
    user: database.user_name,
    postgres: database.version.split(" ").slice(0, 2).join(" "),
    tables: tables.map(({ table_name }) => table_name),
  }, null, 2));
} catch (error) {
  const failure = error as { code?: string; message?: string };
  console.error(JSON.stringify({ connected: false, code: failure.code ?? null, message: failure.message ?? "Unknown database error" }, null, 2));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
