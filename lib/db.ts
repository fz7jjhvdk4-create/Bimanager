import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// SSL hanteras via ssl-objektet nedan, så vi tar bort sslmode/channel_binding
// ur connection-strängen. Det undviker pg:s deprecation-varning om sslmode
// utan att ändra någon Vercel-miljövariabel.
function cleanConnectionString(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}

// Beloppfälten lagras som Decimal i databasen (exakt aritmetik), men resten av
// appen räknar och serialiserar JS-tal. Utan konvertering skulle Decimal
// serialiseras som strängar i JSON-svaren. Kronbelopp ryms gott inom
// Number-precision, så konverteringen är förlustfri.
function konverteraDecimaler(varde: unknown): unknown {
  if (varde === null || typeof varde !== "object") return varde;
  if (Prisma.Decimal.isDecimal(varde)) {
    return (varde as Prisma.Decimal).toNumber();
  }
  if (varde instanceof Date) return varde;
  if (Array.isArray(varde)) return varde.map(konverteraDecimaler);
  const resultat: Record<string, unknown> = {};
  for (const [nyckel, inre] of Object.entries(varde)) {
    resultat[nyckel] = konverteraDecimaler(inre);
  }
  return resultat;
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: cleanConnectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: true },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return konverteraDecimaler(await query(args));
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
