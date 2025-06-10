
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set.');
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  // You might need to add SSL configuration for some cloud providers like Vercel Postgres, Neon, etc.
  // ssl: {
  //   rejectUnauthorized: false, // Adjust as per your provider's requirements
  // },
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
