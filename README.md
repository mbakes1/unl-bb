# unl-bb - OCDS API Viewer

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework with App Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **API Proxy** - Built-in CORS proxy for accessing OCDS API
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Mode** - Built-in dark/light theme toggle

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.

## Project Structure

```
unl-bb/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   │   ├── api/       # API routes (proxy)
│   │   │   │   ├── detail/    # Tender detail page
│   │   │   │   └── page.tsx   # Main releases listing
│   │   │   ├── components/    # Shared components
│   │   │   └── lib/           # Utility functions
```

## Available Scripts

- `npm run dev`: Start all applications in development mode
- `npm run build`: Build all applications
- `npm run dev:web`: Start only the web application
- `npm run check-types`: Check TypeScript types across all apps

## Features

### OCDS Releases Browser
- Browse South African Government Procurement Data
- Filter by date range
- Adjust page size
- Pagination controls
- Responsive card layout
- Full-text search across multiple fields (title, buyer name, status, procurement method)
- Improved search performance using PostgreSQL full-text search

### Tender Detail Viewer
- Detailed view of individual tenders
- Procuring entity information
- Procurement method and category details
- Tender period dates
- Document downloads

### API Proxy
- Built-in CORS proxy for accessing the OCDS API
- Server-side API routes to bypass CORS restrictions
- Error handling and logging

## API Endpoints

- `/api/OCDSReleases` - Proxy for listing releases
- `/api/OCDSReleases/release/[ocid]` - Proxy for individual release details
