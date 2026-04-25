import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: join(process.cwd(), '.env.local') })

import { db } from './db'

export async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is not set — skipping migration')
    return
  }
  const sql = readFileSync(join(process.cwd(), 'db/schema.sql'), 'utf-8')
  await db.unsafe(sql)
  console.log('✅ Migration complete')
}

if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err)
      process.exit(1)
    })
}
