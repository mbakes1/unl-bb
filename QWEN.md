# OCDS API Viewer - Project Context

## Project Overview

This is an OCDS (Open Contracting Data Standard) API Viewer application built with Next.js, TypeScript, and TailwindCSS. The application provides a high-performance caching layer using Neon DB and Prisma to cache South African Government Procurement Data from the OCDS API.

### Key Features

1. **OCDS Releases Browser**
   - Browse South African Government Procurement Data
   - Filter by date range, search terms, and industry categories
   - Pagination controls with adjustable page sizes
   - Responsive card layout with status indicators
   - Full-text search using PostgreSQL full-text search

2. **Tender Detail Viewer**
   - Detailed view of individual tenders
   - Procuring entity information
   - Procurement method and category details
   - Tender period dates with countdown timers
   - Document downloads with preview capabilities

3. **API Proxy with Caching**
   - Built-in CORS proxy for accessing the OCDS API
   - Server-side API routes to bypass CORS restrictions
   - PostgreSQL database caching for improved performance
   - Automatic data ingestion with cron jobs

4. **Performance Optimizations**
   - React Query for data fetching and caching
   - Next.js App Router with server-side rendering
   - Full-text search using PostgreSQL tsvector
   - Smart prefetching of detail pages
   - Performance monitoring utilities

## Project Structure

```
unl-bb/
├── apps/
│   └── web/              # Next.js frontend application
│       ├── src/
│       │   ├── app/          # App Router pages
│       │   │   ├── api/      # API routes (proxy)
│       │   │   ├── detail/   # Tender detail page
│       │   │   └── page.tsx  # Main releases listing
│       │   ├── components/   # Shared UI components
│       │   ├── lib/          # Utility functions and data fetching
│       │   └── scripts/      # Development and maintenance scripts
│       ├── prisma/           # Database schema and migrations
│       └── public/           # Static assets
├── package.json              # Root package configuration
└── vercel.json               # Vercel deployment configuration
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS, shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Database**: PostgreSQL (Neon DB)
- **ORM**: Prisma
- **Deployment**: Vercel
- **API**: OCDS API (https://ocds-api.etenders.gov.za)

## Development Setup

### Prerequisites

1. Node.js (version specified in package.json)
2. PostgreSQL database (Neon DB recommended)
3. npm package manager

### Environment Variables

Create a `.env` file in `apps/web/` with:

```bash
DATABASE_URL="your-neon-connection-string"
CRON_SECRET="your-secure-random-string"
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push
```

### Running the Application

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Check TypeScript types
npm run check-types
```

The application will be available at http://localhost:3001

## Database Schema

The application uses a relational database schema with the following key models:

- **Release**: Main OCDS release data
- **Tender**: Tender information with related data
- **Buyer**: Procuring entity information
- **Party**: Parties involved in the procurement
- **Award**: Award information
- **Contract**: Contract details
- **Document**: Associated documents
- **IngestionState**: Tracks data ingestion status

## API Endpoints

### Frontend Routes

- `/` - Main releases listing with filters
- `/detail?ocid=[ocid]` - Detailed view of a specific tender

### API Routes

- `/api/OCDSReleases` - Proxy for listing releases with caching
- `/api/OCDSReleases/release/[ocid]` - Proxy for individual release details
- `/api/ingest` - Cron job endpoint for data ingestion (secured)
- `/api/test-ingest` - Manual trigger for data ingestion (development)

## Performance Optimizations

1. **Database Caching**: All data is cached in PostgreSQL with full-text search
2. **React Query**: Client-side caching with smart invalidation
3. **Prefetching**: Detail pages are prefetched on hover
4. **Full-Text Search**: PostgreSQL tsvector for efficient text searches
5. **Smart Caching**: Background caching of current page details
6. **Performance Monitoring**: Built-in tracking of database and API performance

## Deployment

The application is configured for deployment on Vercel with:

1. **Cron Jobs**: Automatic data ingestion every 6 hours
2. **Environment Variables**: DATABASE_URL and CRON_SECRET
3. **Edge Functions**: Serverless API routes

To deploy:
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with root directory set to `apps/web`

## Data Ingestion

The application automatically ingests data from the OCDS API using:
1. Initial data population on first request
2. Background refresh when data is older than 4 hours
3. Scheduled cron jobs (every 6 hours) for continuous updates

## Development Scripts

- `npm run db:ingest` - Manual data ingestion
- `npm run db:bulk-ingest` - Bulk data ingestion
- `npm run db:backfill` - Backfill industry data
- `npm run test:search` - Test search performance
- `npm run check-types` - TypeScript type checking

## Monitoring and Maintenance

- Monitor Vercel Functions tab for cron execution logs
- Check Neon dashboard for database usage and performance
- Adjust cron frequency in `vercel.json` if needed
- Add more indexes to Prisma schema for specific filtering needs