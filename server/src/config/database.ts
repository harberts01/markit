import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dotenv from "dotenv";
import * as schema from "../models/schema.js";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

export const db = drizzle(pool, { schema });
export { pool };
