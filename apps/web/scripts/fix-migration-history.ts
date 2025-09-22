import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigrationHistory() {
  try {
    // Delete the failed migration entry
    await prisma.$executeRaw`
      DELETE FROM _prisma_migrations 
      WHERE migration_name = '20250912144313_add_full_text_search'
    `;
    
    console.log('Deleted failed migration entry from history');
  } catch (error) {
    console.error('Error fixing migration history:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigrationHistory();