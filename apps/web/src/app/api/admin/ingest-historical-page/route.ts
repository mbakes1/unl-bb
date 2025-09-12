// /apps/web/src/app/api/admin/ingest-historical-page/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { processAndSavePage } from '@/lib/processAndSavePage';

export async function POST(request: Request) {
  // Add robust security check here (e.g., check for admin session)
  
  const state = await prisma.ingestionState.findUnique({ where: { id: 'singleton' } });
  if (!state || state.isBackfillComplete) {
    return NextResponse.json({ message: 'Backfill is already complete or state is not initialized.' });
  }

  const nextPage = state.lastHistoricalPage + 1;
  const pageSize = 5000; // Fetch large chunks as we are not in a browser
  const dateFrom = "2023-01-01"; // Or your desired start date

  const response = await fetch(`https://ocds-api.etenders.gov.za/api/OCDSReleases?PageNumber=${nextPage}&PageSize=${pageSize}&dateFrom=${dateFrom}`);
  
  if (!response.ok) { 
    console.error(`Failed to fetch page ${nextPage}: ${response.statusText}`);
    return NextResponse.json({ message: `Failed to fetch page ${nextPage}` }, { status: 500 });
  }
  
  const data = await response.json();
  const releases = data.releases || [];

  // Process and save all data points for this page into the new relational schema
  // This will be a complex function mapping the JSON to your Prisma models
  await processAndSavePage(releases);

  await prisma.ingestionState.update({
    where: { id: 'singleton' },
    data: { lastHistoricalPage: nextPage },
  });

  // If more data exists, trigger the next run
  if (data.links?.next) {
    // Fire-and-forget call to the next page
    fetch(`${process.env.VERCEL_URL}/api/admin/ingest-historical-page`, { method: 'POST' });
  } else {
    // No more pages, mark backfill as complete
    await prisma.ingestionState.update({
        where: { id: 'singleton' },
        data: { isBackfillComplete: true },
    });
  }
  
  return NextResponse.json({ message: `Successfully ingested page ${nextPage}. Triggering next page.` });
}