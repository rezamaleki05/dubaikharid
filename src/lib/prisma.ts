import { PrismaClient } from "../generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getDatabaseUrl } from "./env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 15_000,
    allowExitOnIdle: true,
  });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
