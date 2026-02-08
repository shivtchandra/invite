import { Pool } from "pg";

type GlobalWithPool = typeof globalThis & {
  inviteDbPool?: Pool;
};

const globalWithPool = globalThis as GlobalWithPool;

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  return new Pool({
    connectionString,
    max: 10
  });
}

export function getDbPool() {
  if (!globalWithPool.inviteDbPool) {
    globalWithPool.inviteDbPool = createPool();
  }
  return globalWithPool.inviteDbPool;
}

