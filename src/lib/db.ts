import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

const globalForDb = globalThis as unknown as { db: postgres.Sql }

export const db = globalForDb.db ?? postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
