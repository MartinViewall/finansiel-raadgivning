import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse mysql://user:pass@host:port/db
const url = new URL(dbUrl);
const conn = await createConnection({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
  multipleStatements: true,
});

// Apply migration
const migrationSql = readFileSync(join(__dirname, '../drizzle/0003_equal_bullseye.sql'), 'utf8');
const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

console.log('Applying migration...');
for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log('✓', stmt.slice(0, 60).replace(/\n/g, ' '));
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.message.includes('already exists') || e.message.includes('Duplicate')) {
      console.log('⚠ Already exists, skipping:', stmt.slice(0, 60).replace(/\n/g, ' '));
    } else {
      console.error('✗ Error:', e.message);
    }
  }
}

// Apply seed data
const seedSql = readFileSync(join(__dirname, '../drizzle/seed_insurance.sql'), 'utf8');
const seedStatements = seedSql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('\nSeeding data...');
for (const stmt of seedStatements) {
  try {
    await conn.execute(stmt);
    console.log('✓', stmt.slice(0, 80).replace(/\n/g, ' '));
  } catch (e) {
    if (e.message.includes('Duplicate')) {
      console.log('⚠ Duplicate, skipping');
    } else {
      console.error('✗ Error:', e.message, '\nSQL:', stmt.slice(0, 100));
    }
  }
}

await conn.end();
console.log('\nDone!');
