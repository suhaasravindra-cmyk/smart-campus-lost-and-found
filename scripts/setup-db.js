/**
 * Database Migration & Seeding Runner
 * Executes all SQL scripts in the correct relational sequence against PostgreSQL.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://campus_admin:campus_secure_password@localhost:5432/smart_lost_and_found';

const SQL_FILES = [
  '01_schema.sql',
  '02_views.sql',
  '03_functions_procedures.sql',
  '04_triggers.sql',
  '05_seed.sql',
];

async function runMigrations() {
  console.log('====================================================');
  console.log('🔄 Connecting to PostgreSQL database...');
  console.log(`📡 URL: ${connectionString.replace(/:[^:@]*@/, ':****@')}`);
  console.log('====================================================');

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected successfully.\n');

    for (const file of SQL_FILES) {
      const filePath = path.join(__dirname, '..', 'database', file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Warning: ${file} not found, skipping.`);
        continue;
      }

      console.log(`⏳ Executing database/${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✅ database/${file} executed successfully.`);
    }

    console.log('\n====================================================');
    console.log('🎉 Database setup complete! All schemas, views,');
    console.log('   procedures, triggers, and seeds are ready.');
    console.log('====================================================');
  } catch (error) {
    console.error('\n❌ Error executing migrations:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
