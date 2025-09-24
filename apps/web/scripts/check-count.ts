import { PrismaClient } from '@prisma/client';

async function checkCount() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.release.count();
    console.log(`Current release count: ${count}`);
  } catch (error) {
    console.error('Error checking count:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCount();