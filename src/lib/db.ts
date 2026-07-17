import { Pool } from "pg";

// Replit provides DATABASE_URL automatically for the built-in PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export default pool;
