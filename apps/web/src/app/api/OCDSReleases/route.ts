import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performanceMonitor, dbCacheMetrics } from "@/lib/performance-monitor";

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
    const pageSize = Math.min(
      parseInt(searchParams.get("PageSize") || "50"),
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
    const sortBy = searchParams.get("sortBy") || "releaseDate";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause for filtering
    const where: any = {};

    if (dateFrom || dateTo) {
      where.releaseDate = {};
      if (dateFrom) {
        where.releaseDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.releaseDate.lte = new Date(dateTo + "T23:59:59.999Z");
      }
    }

    // Text search using PostgreSQL full-text search
    let additionalWhereClause = '';
    let additionalParams: any[] = [];
    if (searchQuery) {
      additionalWhereClause = `AND "searchVector" @@ to_tsquery('english', ${additionalParams.length + 1})`;
      additionalParams.push(searchQuery.split(' ').join(' & ')); // Convert to tsquery format
    }

    // Status filter
    if (status) {
      where.status = {
        contains: status,
        mode: "insensitive"
      };
    }

    // Procurement method filter
    if (procurementMethod) {
      where.procurementMethod = {
        contains: procurementMethod,
        mode: "insensitive"
      };
    }

    // Buyer name filter
    if (buyerName) {
      where.buyerName = {
        contains: buyerName,
        mode: "insensitive"
      };
    }

    // Value range filter
    if (minValue || maxValue) {
      where.valueAmount = {};
      if (minValue) {
        where.valueAmount.gte = parseFloat(minValue);
      }
      if (maxValue) {
        where.valueAmount.lte = parseFloat(maxValue);
      }
    }

    // Currency filter
    if (currency) {
      where.currency = currency;
    }

    // Industry filter - handle "__all__" value as no filter
    if (mainProcurementCategory && mainProcurementCategory !== "__all__") {
      where.mainProcurementCategory = mainProcurementCategory;
    }

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

    // Build orderBy clause
    let orderBy: any = { releaseDate: "desc" };
    if (sortBy) {
      switch (sortBy) {
        case "releaseDate":
          orderBy = { releaseDate: sortOrder };
          break;
        case "valueAmount":
          orderBy = { valueAmount: sortOrder };
          break;
        case "buyerName":
          orderBy = { buyerName: sortOrder };
          break;
        case "title":
          orderBy = { title: sortOrder };
          break;
        default:
          orderBy = { releaseDate: "desc" };
      }
    }

    const dbTracker = performanceMonitor.trackDatabaseQuery("findReleases", {
      page,
      pageSize,
    });
    dbTracker.start();

    // Build base query parameters
    const baseParams = [
      (page - 1) * pageSize,
      pageSize
    ];

    // Build WHERE clause for filters
    let whereClause = "WHERE 1=1";
    const filterParams: any[] = [];
    
    // Date filters
    if (dateFrom) {
      whereClause += ` AND "releaseDate" >= ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(new Date(dateFrom));
    }
    if (dateTo) {
      whereClause += ` AND "releaseDate" <= ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(new Date(dateTo + "T23:59:59.999Z"));
    }
    
    // Status filter
    if (status) {
      whereClause += ` AND "status" ILIKE ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(`%${status}%`);
    }
    
    // Procurement method filter
    if (procurementMethod) {
      whereClause += ` AND "procurementMethod" ILIKE ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(`%${procurementMethod}%`);
    }
    
    // Buyer name filter
    if (buyerName) {
      whereClause += ` AND "buyerName" ILIKE ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(`%${buyerName}%`);
    }
    
    // Value range filter
    if (minValue) {
      whereClause += ` AND "valueAmount" >= ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(parseFloat(minValue));
    }
    if (maxValue) {
      whereClause += ` AND "valueAmount" <= ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(parseFloat(maxValue));
    }
    
    // Currency filter
    if (currency) {
      whereClause += ` AND "currency" = ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(currency);
    }
    
    // Industry filter
    if (mainProcurementCategory && mainProcurementCategory !== "__all__") {
      whereClause += ` AND "mainProcurementCategory" = ${filterParams.length + baseParams.length + 1}`;
      filterParams.push(mainProcurementCategory);
    }
    
    // Text search using PostgreSQL full-text search
    if (searchQuery) {
      whereClause += ` AND "searchVector" @@ to_tsquery('english', ${filterParams.length + baseParams.length + 1})`;
      filterParams.push(searchQuery.split(' ').join(' & ')); // Convert to tsquery format
    }

    // Build ORDER BY clause
    let orderByClause = "";
    switch (sortBy) {
      case "releaseDate":
        orderByClause = `"releaseDate" ${sortOrder}`;
        break;
      case "valueAmount":
        orderByClause = `"valueAmount" ${sortOrder}`;
        break;
      case "buyerName":
        orderByClause = `"buyerName" ${sortOrder}`;
        break;
      case "title":
        orderByClause = `"title" ${sortOrder}`;
        break;
      default:
        orderByClause = `"releaseDate" DESC`;
    }

    // Combine all parameters
    const allParams = [...baseParams, ...filterParams];

    // Use raw SQL queries for better performance with full-text search
    const [totalCountResult, releasesResult] = await Promise.all([
      prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "public"."Release" ${whereClause}`,
        ...filterParams
      ),
      prisma.$queryRawUnsafe(
        `SELECT "data" FROM "public"."Release" ${whereClause} ORDER BY ${orderByClause} LIMIT $2 OFFSET $1`,
        ...allParams
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
    // Add required date parameters
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // 30 days ago

    const response = await fetch(
      `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=50&PageNumber=1&dateFrom=${dateFrom}&dateTo=${dateTo}`
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    const releases = data.releases || [];

    console.log(`Populating ${releases.length} initial releases...`);

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

    console.log("Initial data population completed");
  } catch (error) {
    console.error("Failed to populate initial data:", error);
    throw error;
  }
}

// Background refresh function
async function refreshDataInBackground() {
  try {
    // Add required date parameters
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // 30 days ago

    const response = await fetch(
      `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=1&dateFrom=${dateFrom}&dateTo=${dateTo}`
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
