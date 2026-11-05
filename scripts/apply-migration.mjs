import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'

const file = process.argv[2]
if (!file) throw new Error('Usage: node scripts/apply-migration.mjs <migration.sql>')

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!connectionString) throw new Error('Missing DATABASE_URL_UNPOOLED or DATABASE_URL')

const statements = (await readFile(file, 'utf8'))
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean)

const sql = neon(connectionString)
for (const statement of statements) await sql.query(statement)
console.log(`Applied ${statements.length} statements from ${file}`)
