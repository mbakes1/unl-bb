import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performanceMonitor, dbCacheMetrics } from "@/lib/performance-monitor";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Check if we have any data in the database
    const dataCount = await prisma.release.count();

    // If no data exists, populate some initial data
    if (dataCount === 0) {
      console.log("No data found, populating initial cache...");
      await populateInitialData();
    }

    // Parse query parameters
    const page = parseInt(searchParams.get("PageNumber") || "1");
    // Default to maximum allowed page size if not specified, to show most results possible
    const pageSize = Math.min(
      parseInt(searchParams.get("PageSize") || "20000"),
      20000
    );
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const searchQuery = searchParams.get("search");
    const mainProcurementCategory = searchParams.get("mainProcurementCategory");
    const status = searchParams.get("status");
    const procurementMethod = searchParams.get("procurementMethod");
    const buyerName = searchParams.get("buyerName");
    const minValue = searchParams.get("minValue");
    const maxValue = searchParams.get("maxValue");
    const currency = searchParams.get("currency");
    const province = searchParams.get("province"); // Add province filter
    const sortBy = searchParams.get("sortBy") || "releaseDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Check data freshness and trigger background update if needed
    const latestRelease = await prisma.release.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (latestRelease) {
      const hoursSinceUpdate =
        (Date.now() - latestRelease.createdAt.getTime()) / (1000 * 60 * 60);

      // Trigger background update if data is older than 4 hours
      if (hoursSinceUpdate > 4) {
        console.log("Data is stale, triggering background refresh...");
        // Don't await - let it run in background
        refreshDataInBackground().catch(console.error);
      }
    }

    const dbTracker = performanceMonitor.trackDatabaseQuery("findReleases", {
      page,
      pageSize,
    });
    dbTracker.start();

    // Build conditions for filters
    const conditions = [];
    
    // Date filters with proper date handling
    if (dateFrom) {
      conditions.push(Prisma.sql`"releaseDate" >= ${new Date(dateFrom)}`);
    }
    if (dateTo) {
      // Create end of day date for inclusive filtering
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(Prisma.sql`"releaseDate" <= ${endDate}`);
    }
    
    // Status filter
    if (status) {
      conditions.push(Prisma.sql`"status" ILIKE ${`%${status}%`}`);
    }
    
    // Procurement method filter
    if (procurementMethod) {
      conditions.push(Prisma.sql`"procurementMethod" ILIKE ${`%${procurementMethod}%`}`);
    }
    
    // Buyer name filter
    if (buyerName) {
      conditions.push(Prisma.sql`"buyerName" ILIKE ${`%${buyerName}%`}`);
    }
    
    // Value range filter
    if (minValue) {
      conditions.push(Prisma.sql`"valueAmount" >= ${parseFloat(minValue)}`);
    }
    if (maxValue) {
      conditions.push(Prisma.sql`"valueAmount" <= ${parseFloat(maxValue)}`);
    }
    
    // Currency filter
    if (currency) {
      conditions.push(Prisma.sql`"currency" = ${currency}`);
    }
    
    // Province filter
    if (province && province !== "__all__") {
      conditions.push(Prisma.sql`"province" = ${province}`);
    }
    
    // Industry filter
    if (mainProcurementCategory && mainProcurementCategory !== "__all__") {
      conditions.push(Prisma.sql`"mainProcurementCategory" = ${mainProcurementCategory}`);
    }
    
    // Text search using PostgreSQL full-text search with proper query sanitization
    if (searchQuery) {
      // Sanitize the search query by removing special characters and extra spaces
      const sanitizedQuery = searchQuery
        .replace(/[^\w\s]/g, ' ') // Remove special characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      if (sanitizedQuery) {
        // Convert to tsquery format
        const tsQuery = sanitizedQuery.split(' ').join(' & ');
        conditions.push(Prisma.sql`"searchVector" @@ to_tsquery('english', ${tsQuery})`);
      }
    }

    // Build WHERE clause
    const whereClause = conditions.length 
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty;

    // Build ORDER BY clause
    let orderByClause;
    switch (sortBy) {
      case "releaseDate":
        orderByClause = Prisma.sql`"releaseDate" ${Prisma.raw(sortOrder)}`;
        break;
      case "valueAmount":
        orderByClause = Prisma.sql`"valueAmount" ${Prisma.raw(sortOrder)}`;
        break;
      case "buyerName":
        orderByClause = Prisma.sql`"buyerName" ${Prisma.raw(sortOrder)}`;
        break;
      case "title":
        orderByClause = Prisma.sql`"title" ${Prisma.raw(sortOrder)}`;
        break;
      default:
        orderByClause = Prisma.sql`"releaseDate" DESC`;
    }

    // Use raw SQL queries for better performance with full-text search
    const [totalCountResult, releasesResult] = await Promise.all([
      prisma.$queryRaw(
        Prisma.sql`SELECT COUNT(*) as count FROM "public"."Release" ${whereClause}`
      ),
      prisma.$queryRaw(
        Prisma.sql`SELECT "data" FROM "public"."Release" ${whereClause} ORDER BY ${orderByClause} LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`
      )
    ]);

    const totalCount = parseInt((totalCountResult as any)[0].count);
    const releases = releasesResult as any[];

    dbTracker.end();
    dbCacheMetrics.hit(); // We're serving from database

    const releaseData = releases.map((r: { data: any }) => r.data);
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = page < totalPages;

    const response: any = {
      releases: releaseData,
    };

    if (hasNext) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("PageNumber", (page + 1).toString());
      response.links = {
        next: `/api/OCDSReleases?${nextParams.toString()}`,
      };
    }

    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Database error, falling back to external API:", error);

    // Fallback to external API if database fails
    return fallbackToExternalAPI(request);
  }
}

// Populate initial data on first request
async function populateInitialData() {
  try {
    // Add required date parameters (use broader date range)
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = "2024-01-01"; // Start from beginning of 2024

    // We'll fetch multiple pages to get more initial data
    const maxPages = 5; // Fetch first 5 pages
    let totalReleases = 0;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const response = await fetch(
        `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=${pageNum}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) {
        throw new Error(`External API error: ${response.status}`);
      }

      const data = await response.json();
      const releases = data.releases || [];

      console.log(`Populating ${releases.length} releases from page ${pageNum}...`);

      if (releases.length === 0) {
        // No more data, break out of the loop
        break;
      }

      for (const release of releases) {
        try {
          const title = release.tender?.title || "";
          const buyerName =
            release.buyer?.name || release.tender?.procuringEntity?.name || "";
          const status = release.tender?.status || "";
          const procurementMethod = release.tender?.procurementMethod || "";
          const mainProcurementCategory = release.tender?.mainProcurementCategory || "";
          const valueAmount = release.tender?.value?.amount || null;
          const currency = release.tender?.value?.currency || null;
          const releaseDate = release.date ? new Date(release.date) : new Date();
          
          // Create search vector using PostgreSQL's to_tsvector function
          const searchVector = `${title} ${buyerName} ${status} ${procurementMethod}`;

          // Use raw SQL to insert with searchVector since it's Unsupported in Prisma
          await prisma.$executeRaw`
            INSERT INTO "public"."Release" (
              "ocid", "releaseDate", "data", "title", "buyerName", "status", 
              "procurementMethod", "mainProcurementCategory", "valueAmount", "currency", "searchVector"
            ) VALUES (
              ${release.ocid}, ${releaseDate}, ${release}, ${title}, ${buyerName}, ${status},
              ${procurementMethod}, ${mainProcurementCategory}, ${valueAmount}, ${currency}, 
              setweight(to_tsvector('english', ${title}), 'A') ||
              setweight(to_tsvector('english', ${buyerName}), 'B') ||
              setweight(to_tsvector('english', ${status}), 'C') ||
              setweight(to_tsvector('english', ${procurementMethod}), 'C')
            )
          `;
        } catch (error) {
          // Skip duplicates or other errors
          console.error(`Error creating release ${release.ocid}:`, error);
        }
      }

      totalReleases += releases.length;
      console.log(`Completed page ${pageNum}, total releases so far: ${totalReleases}`);

      // Stop if we received less than a full page (meaning no more data)
      if (releases.length < 100) {
        break;
      }
    }

    console.log(`Initial data population completed with ${totalReleases} releases`);
  } catch (error) {
    console.error("Failed to populate initial data:", error);
    throw error;
  }
}

// Background refresh function
async function refreshDataInBackground() {
  try {
    // Add required date parameters (use broader date range)
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = "2024-01-01"; // Start from beginning of 2024

    // We'll fetch multiple pages to get more data during background refresh
    const maxPages = 3; // Fetch first 3 pages of new/updated data
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const response = await fetch(
        `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=${pageNum}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );

      if (!response.ok) return;

      const data = await response.json();
      const releases = data.releases || [];

      for (const release of releases) {
        try {
          const title = release.tender?.title || "";
          const buyerName =
            release.buyer?.name || release.tender?.procuringEntity?.name || "";
          const status = release.tender?.status || "";
          const procurementMethod = release.tender?.procurementMethod || "";
          const mainProcurementCategory = release.tender?.mainProcurementCategory || "";
          const valueAmount = release.tender?.value?.amount || null;
          const currency = release.tender?.value?.currency || null;
          const releaseDate = release.date ? new Date(release.date) : new Date();
          
          // Create search vector using PostgreSQL's to_tsvector function
          const searchVector = `${title} ${buyerName} ${status} ${procurementMethod}`;

          // Use raw SQL for upsert since searchVector is Unsupported in Prisma
          await prisma.$executeRaw`
            INSERT INTO "public"."Release" (
              "ocid", "releaseDate", "data", "title", "buyerName", "status", 
              "procurementMethod", "mainProcurementCategory", "valueAmount", "currency", "searchVector"
            ) VALUES (
              ${release.ocid}, ${releaseDate}, ${release}, ${title}, ${buyerName}, ${status},
              ${procurementMethod}, ${mainProcurementCategory}, ${valueAmount}, ${currency},
              setweight(to_tsvector('english', ${title}), 'A') ||
              setweight(to_tsvector('english', ${buyerName}), 'B') ||
              setweight(to_tsvector('english', ${status}), 'C') ||
              setweight(to_tsvector('english', ${procurementMethod}), 'C')
            )
            ON CONFLICT ("ocid") DO UPDATE SET
              "releaseDate" = EXCLUDED."releaseDate",
              "data" = EXCLUDED."data",
              "title" = EXCLUDED."title",
              "buyerName" = EXCLUDED."buyerName",
              "status" = EXCLUDED."status",
              "procurementMethod" = EXCLUDED."procurementMethod",
              "mainProcurementCategory" = EXCLUDED."mainProcurementCategory",
              "valueAmount" = EXCLUDED."valueAmount",
              "currency" = EXCLUDED."currency",
              "searchVector" = 
                setweight(to_tsvector('english', EXCLUDED."title"), 'A') ||
                setweight(to_tsvector('english', EXCLUDED."buyerName"), 'B') ||
                setweight(to_tsvector('english', EXCLUDED."status"), 'C') ||
                setweight(to_tsvector('english', EXCLUDED."procurementMethod"), 'C')
          `;
        } catch (error) {
          // Continue with other releases
          console.error(`Error upserting release ${release.ocid}:`, error);
        }
      }

      // Stop if we received less than a full page (meaning no more data)
      if (releases.length < 100) {
        break;
      }
    }
  } catch (error) {
    console.error("Background refresh failed:", error);
  }
}

// Fallback to external API
async function fallbackToExternalAPI(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();

  try {
    const targetUrl = `https://ocds-api.etenders.gov.za/api/OCDSReleases?${queryString}`;

    const response = await fetch(targetUrl, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "API error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
