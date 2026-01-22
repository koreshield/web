import pg from "pg";

const { Pool } = pg;

let tigerData: pg.Pool | null = null;

function getTigerData() {
  if (!tigerData) {
    const connectionString = process.env.TIGER_DATA_URL;
    if (!connectionString) {
      throw new Error("TIGER_DATA_URL environment variable is required for analytics features");
    }
    tigerData = new Pool({
      connectionString,
      ssl:{
        rejectUnauthorized: false,
      }
    });
  }
  return tigerData;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  try {
    const db = getTigerData();
    const result = await db.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error('TimescaleDB query error:', error);
    throw error;
  }
}

export async function execute(text: string, params?: unknown[]): Promise<void> {
  try {
    const db = getTigerData();
    await db.query(text, params);
  } catch (error) {
    console.error('TimescaleDB execute error:', error);
    throw error;
  }
}

// Test connection function
export async function testConnection(): Promise<boolean> {
  try {
    const db = getTigerData();
    const client = await db.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ TimescaleDB connection successful');
    return true;
  } catch (error) {
    console.error('❌ TimescaleDB connection failed:', error);
    return false;
  }
}