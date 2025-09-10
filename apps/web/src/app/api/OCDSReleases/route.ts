import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      100
    );
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const searchQuery = searchParams.get("search");

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

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { buyerName: { contains: searchQuery, mode: "insensitive" } },
      ];
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

    const totalCount = await prisma.release.count({ where });
    const releases = await prisma.release.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { releaseDate: "desc" },
      select: { data: true },
    });

    const releaseData = releases.map((r) => r.data);
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
        const releaseDate = release.date ? new Date(release.date) : new Date();

        await prisma.release.create({
          data: {
            ocid: release.ocid,
            releaseDate,
            data: release,
            title,
            buyerName,
            status,
          },
        });
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
        const releaseDate = release.date ? new Date(release.date) : new Date();

        await prisma.release.upsert({
          where: { ocid: release.ocid },
          update: {
            releaseDate,
            data: release,
            title,
            buyerName,
            status,
          },
          create: {
            ocid: release.ocid,
            releaseDate,
            data: release,
            title,
            buyerName,
            status,
          },
        });
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
