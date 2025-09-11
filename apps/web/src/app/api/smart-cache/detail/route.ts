import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { ocids } = await request.json();

    if (!Array.isArray(ocids) || ocids.length === 0) {
      return NextResponse.json(
        { error: "Invalid ocids array" },
        { status: 400 }
      );
    }

    // Limit to prevent abuse
    const limitedOcids = ocids.slice(0, 10);

    // Check which releases are missing or stale in our database
    const existingReleases = await prisma.release.findMany({
      where: {
        ocid: { in: limitedOcids },
      },
      select: {
        ocid: true,
        updatedAt: true,
      },
    });

    const existingOcids = new Set(existingReleases.map((r) => r.ocid));
    const staleThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours
    const staleOcids = existingReleases
      .filter((r) => r.updatedAt < staleThreshold)
      .map((r) => r.ocid);

    const missingOcids = limitedOcids.filter(
      (ocid) => !existingOcids.has(ocid)
    );
    const ocidsToFetch = [...missingOcids, ...staleOcids];

    if (ocidsToFetch.length === 0) {
      return NextResponse.json({
        message: "All releases are up to date",
        cached: limitedOcids.length,
        fetched: 0,
      });
    }

    // Fetch missing/stale releases from external API
    const fetchPromises = ocidsToFetch.map(async (ocid) => {
      try {
        const response = await fetch(
          `https://ocds-api.etenders.gov.za/api/OCDSReleases/release/${encodeURIComponent(
            ocid
          )}`
        );

        if (!response.ok) {
          console.log(`Failed to fetch ${ocid}: ${response.status}`);
          return null;
        }

        const releaseData = await response.json();

        // Extract searchable fields
        const title = releaseData.tender?.title || "";
        const buyerName =
          releaseData.buyer?.name ||
          releaseData.tender?.procuringEntity?.name ||
          "";
        const status = releaseData.tender?.status || "";
        const releaseDate = releaseData.date
          ? new Date(releaseData.date)
          : new Date();

        await prisma.release.upsert({
          where: { ocid },
          update: {
            releaseDate,
            data: releaseData,
            title,
            buyerName,
            status,
          },
          create: {
            ocid,
            releaseDate,
            data: releaseData,
            title,
            buyerName,
            status,
          },
        });

        return ocid;
      } catch (error) {
        console.error(`Error caching ${ocid}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const successfulFetches = results
      .filter(
        (result): result is PromiseFulfilledResult<string> =>
          result.status === "fulfilled" && result.value !== null
      )
      .map((result) => result.value);

    return NextResponse.json({
      message: "Smart cache update completed",
      requested: limitedOcids.length,
      cached: limitedOcids.length - ocidsToFetch.length,
      fetched: successfulFetches.length,
      failed: ocidsToFetch.length - successfulFetches.length,
    });
  } catch (error) {
    console.error("Smart cache error:", error);
    return NextResponse.json(
      { error: "Smart cache failed", message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
