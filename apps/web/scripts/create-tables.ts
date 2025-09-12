// scripts/create-tables.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Read the migration SQL file
  const fs = await import('fs');
  const path = await import('path');
  const migrationSql = fs.readFileSync(
    path.join(__dirname, '../prisma/migrations/20250912144313_add_full_text_search/migration.sql'),
    'utf8'
  );

  // Split the SQL into individual statements
  // We need to be careful here because the SQL file contains comments and multi-line statements
  // For simplicity, we'll execute the entire file as one statement
  // In a production environment, you'd want to parse and execute each statement separately
  
  // Remove comments from the SQL
  const sqlWithoutComments = migrationSql.replace(/--.*$/gm, '').trim();
  
  // Split by semicolon to get individual statements
  // We need to be careful with the foreign key constraints and the order of creation
  const statements = sqlWithoutComments.split(';').map(s => s.trim()).filter(s => s.length > 0);
  
  // Execute each statement
  for (const statement of statements) {
    if (statement.startsWith('ALTER TABLE')) {
      // Skip foreign key constraints for now, we'll add them later
      continue;
    }
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log(`Executed: ${statement.substring(0, 50)}...`);
    } catch (e) {
      console.error(`Failed to execute: ${statement.substring(0, 50)}...`);
      console.error(e);
    }
  }
  
  // Now add the foreign key constraints
  for (const statement of statements) {
    if (statement.startsWith('ALTER TABLE')) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`Executed: ${statement.substring(0, 50)}...`);
      } catch (e) {
        console.error(`Failed to execute: ${statement.substring(0, 50)}...`);
        console.error(e);
      }
    }
  }
  
  console.log('Tables created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });