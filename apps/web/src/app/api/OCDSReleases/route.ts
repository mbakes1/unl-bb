import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  try {
    // Parse query parameters
    const page = parseInt(searchParams.get("PageNumber") || "1");
    const pageSize = Math.min(
      parseInt(searchParams.get("PageSize") || "50"),
      100
    ); // Cap at 100
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const searchQuery = searchParams.get("search");

    // Build where clause for filtering
    const where: any = {};

    // Date filtering
    if (dateFrom || dateTo) {
      where.releaseDate = {};
      if (dateFrom) {
        where.releaseDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.releaseDate.lte = new Date(dateTo + "T23:59:59.999Z"); // End of day
      }
    }

    // Search filtering (search in title and buyer name)
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { buyerName: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination info
    const totalCount = await prisma.release.count({ where });

    // Fetch releases with pagination
    const releases = await prisma.release.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        releaseDate: "desc",
      },
      select: {
        data: true, // We only need the JSON data to maintain API compatibility
      },
    });

    // Extract the JSON data to match the original API format
    const releaseData = releases.map((r) => r.data);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Build response with pagination links (matching original API format)
    const response: any = {
      releases: releaseData,
    };

    if (hasNext || hasPrev) {
      response.links = {};
      if (hasNext) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("PageNumber", (page + 1).toString());
        response.links.next = `/api/OCDSReleases?${nextParams.toString()}`;
      }
      if (hasPrev) {
        const prevParams = new URLSearchParams(searchParams);
        prevParams.set("PageNumber", (page - 1).toString());
        response.links.prev = `/api/OCDSReleases?${prevParams.toString()}`;
      }
    }

    return NextResponse.json(response, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        // Add caching headers for better performance
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600", // 5min cache, 10min stale
      },
    });
  } catch (error) {
    console.error("Database query error:", error);
    return NextResponse.json(
      { error: "Database error", message: (error as Error).message },
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
