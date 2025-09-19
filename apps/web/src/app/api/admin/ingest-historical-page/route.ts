// /apps/web/src/app/api/admin/ingest-historical-page/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { processAndSavePage } from '@/lib/processAndSavePage';

export async function POST(request: Request) {
  try {
    // Add robust security check here (e.g., check for admin session)
    
    // Get the ingestion state using raw SQL
    const stateResult: any[] = await prisma.$queryRaw`
      SELECT * FROM "IngestionState" WHERE "id" = 'singleton'
    `;
    const state = stateResult[0];
    
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
    
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error(`Failed to parse JSON for page ${nextPage}:`, error);
      return NextResponse.json({ message: `Failed to parse JSON for page ${nextPage}` }, { status: 500 });
    }
    const releases = data.releases || [];

    // Process and save all data points for this page into the new relational schema
    // This will be a complex function mapping the JSON to your Prisma models
    await processAndSavePage(releases);

    // Update the ingestion state using raw SQL
    await prisma.$executeRaw`
      UPDATE "IngestionState" 
      SET "lastHistoricalPage" = ${nextPage}
      WHERE "id" = 'singleton'
    `;

    // If more data exists, trigger the next run
    if (data.links?.next) {
      const host = request.headers.get('host');
      const protocol = host?.includes('localhost') ? 'http' : 'https';
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${protocol}://${host}`;
      // Fire-and-forget call to the next page
      fetch(`${baseUrl}/api/admin/ingest-historical-page`, { method: 'POST' });
    } else {
      // No more pages, mark backfill as complete
      await prisma.$executeRaw`
        UPDATE "IngestionState"
        SET "isBackfillComplete" = true
        WHERE "id" = 'singleton'
      `;
    }
    
    return NextResponse.json({ message: `Successfully ingested page ${nextPage}. Triggering next page.` });
  } catch (error) {
    console.error('[INGESTION_ERROR]', error);
    return NextResponse.json({ message: 'An unexpected error occurred during ingestion.' }, { status: 500 });
  }
}