# Full-Text Search Implementation

This document explains how the full-text search feature was implemented in the OCDS API Viewer.

## Overview

The previous search implementation used SQL `contains` queries across multiple text fields (title, buyerName, status, procurementMethod). While functional for smaller datasets, this approach became slow and inefficient as the database grew, and lacked advanced features like relevance ranking.

## Solution

We implemented PostgreSQL's built-in Full-Text Search capabilities by:

1. Adding a `searchVector` column of type `tsvector` to the `Release` table
2. Creating a GIN index on the `searchVector` column for highly performant text searches
3. Modifying the application code to populate the `searchVector` column
4. Updating the search query to use PostgreSQL's full-text search operators

## Implementation Details

### Database Schema Changes

We added a `searchVector` column to the `Release` table:

```sql
ALTER TABLE "public"."Release" ADD COLUMN "searchVector" tsvector;
CREATE INDEX "Release_searchVector_idx" ON "public"."Release" USING GIN ("searchVector");
```

### Data Population

The `searchVector` column is populated by concatenating searchable fields with different weights:

- Title (weight A - highest priority)
- Buyer Name (weight B - medium priority)
- Status (weight C - low priority)
- Procurement Method (weight C - low priority)

### Search Query

Instead of using multiple `contains` queries, we now use PostgreSQL's `to_tsquery` function:

```sql
SELECT * FROM "public"."Release" 
WHERE "searchVector" @@ to_tsquery('english', $1)
```

## Performance Benefits

1. **Speed**: Full-text search queries are significantly faster, especially on large datasets
2. **Relevance Ranking**: Results are automatically ranked by relevance
3. **Advanced Features**: Support for phrase searches, boolean operators, and prefix matching
4. **Scalability**: Performance scales much better with dataset size

## Testing

To test the performance improvements, run:

```bash
npm run test:search
```

This script compares the old search method with the new full-text search method and reports the performance improvement.

## Future Improvements

1. Add typo tolerance using PostgreSQL's fuzzy string matching capabilities
2. Implement stemming for better search results
3. Add support for searching in additional fields
4. Consider using PostgreSQL's `pg_trgm` extension for even more advanced text search features