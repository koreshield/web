import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    db = drizzle(process.env.DATABASE_URL, { schema });
  }
  return db;
}

// For backward compatibility, export a getter
export const database = getDb;
