import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Smart caching endpoint that checks data freshness and updates if needed
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Check when we last updated data
    const latestRelease = await prisma.release.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    const now = new Date();
    const lastUpdate = latestRelease?.createdAt || new Date(0);
    const hoursSinceUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    // If data is older than 6 hours, trigger a background update
    let shouldUpdate = hoursSinceUpdate > 6;

    // For manual refresh, check for force parameter
    const forceUpdate = searchParams.get("force") === "true";

    if (shouldUpdate || forceUpdate) {
      console.log("Data is stale, triggering background update...");

      // Trigger update in background (don't wait for it)
      updateDataInBackground().catch((error) => {
        console.error("Background update failed:", error);
      });
    }

    // Always return current data immediately (even if stale)
    const page = parseInt(searchParams.get("PageNumber") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("PageSize") || "50"),
      100
    );
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const searchQuery = searchParams.get("search");

    // Build where clause
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

    const totalCount = await prisma.release.count({ where });
    const releases = await prisma.release.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { releaseDate: "desc" },
      select: {
        id: true,
        ocid: true,
        releaseId: true,
        releaseDate: true,
        initiationType: true,
        language: true,
        tags: true,
        tender: true,
        planning: true,
        buyer: true,
        parties: true,
        awards: true,
        contracts: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const releaseData = releases;
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = page < totalPages;

    const response: any = {
      releases: releaseData,
      meta: {
        lastUpdated: lastUpdate.toISOString(),
        hoursSinceUpdate: Math.round(hoursSinceUpdate * 10) / 10,
        totalCount,
        currentPage: page,
        totalPages,
      },
    };

    if (hasNext) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("PageNumber", (page + 1).toString());
      response.links = {
        next: `/api/smart-cache?${nextParams.toString()}`,
      };
    }

    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Smart cache error:", error);

    // Fallback to external API if database fails
    return fallbackToExternalAPI(request);
  }
}

// Background update function
async function updateDataInBackground() {
  try {
    // Add required date parameters
    const dateTo = new Date().toISOString().split("T")[0]; // Today
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // 30 days ago

    const response = await fetch(
      `https://ocds-api.etenders.gov.za/api/OCDSReleases?pageSize=100&PageNumber=1&dateFrom=${dateFrom}&dateTo=${dateTo}`
    );

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    const releases = data.releases || [];

    console.log(`Updating ${releases.length} releases in background...`);

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
            tender: {
              update: {
                title,
                status,
              },
            },
            buyer: {
              update: {
                name: buyerName,
              },
            },
          },
          create: {
            ocid: release.ocid,
            releaseDate,
            tender: {
              create: {
                tenderId: release.tender?.id || release.ocid,
                title,
                status,
              },
            },
            buyer: {
              create: {
                buyerId: release.buyer?.id || release.ocid,
                name: buyerName,
              },
            },
          },
        });
      } catch (error) {
        console.error(`Error updating release ${release.ocid}:`, error);
      }
    }

    console.log("Background update completed successfully");
  } catch (error) {
    console.error("Background update failed:", error);
    throw error;
  }
}

// Fallback to external API if database is empty or fails
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

    return NextResponse.json({
      ...data,
      meta: {
        source: "external_api_fallback",
        message: "Data served from external API due to cache unavailability",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Both cache and external API failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
