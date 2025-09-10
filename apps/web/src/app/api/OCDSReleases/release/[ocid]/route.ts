import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ocid: string }> }
) {
  const { ocid } = await context.params;

  try {
    // Find the release by OCID in our database
    const release = await prisma.release.findUnique({
      where: { ocid: decodeURIComponent(ocid) },
      select: {
        data: true, // We only need the JSON data to maintain API compatibility
      },
    });

    if (!release) {
      return NextResponse.json(
        { error: "Release not found", ocid },
        { status: 404 }
      );
    }

    return NextResponse.json(release.data, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        // Add aggressive caching for individual releases since they change less frequently
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200", // 1hr cache, 2hr stale
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
