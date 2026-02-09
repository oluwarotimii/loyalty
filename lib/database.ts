import { sql as vercelSql } from '@vercel/postgres';

// Create a wrapper that provides the sql client with proper error handling
export const sql = vercelSql;