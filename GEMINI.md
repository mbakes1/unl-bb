# GEMINI.md

## Project Overview

This is a Next.js web application designed to browse and search Open Contracting Data Standard (OCDS) data, specifically from the South African Government Procurement Data source. The application provides a high-performance caching layer using a PostgreSQL database (Neon DB) to improve performance and reliability.

The project is a monorepo with a web application in the `apps/web` directory. The frontend is built with Next.js, React, and TailwindCSS, and uses `shadcn/ui` for UI components. The backend is a set of API routes within the Next.js application that provide a proxy to the OCDS API and a caching layer that interacts with the PostgreSQL database.

**Key Technologies:**

*   **Framework:** Next.js (with App Router)
*   **Language:** TypeScript
*   **Styling:** TailwindCSS
*   **UI Components:** shadcn/ui
*   **Database:** PostgreSQL (managed by Prisma)
*   **Data Fetching:** TanStack Query
*   **Deployment:** Vercel

## Building and Running

### Prerequisites

*   Node.js and npm
*   A PostgreSQL database (e.g., from [Neon](https://console.neon.tech/))

### Setup

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Configure Environment Variables:**

    Create a `.env` file in the `apps/web` directory and add the following:

    ```
    DATABASE_URL="your-postgresql-connection-string"
    ```

3.  **Initialize the Database:**

    ```bash
    cd apps/web
    npm run db:push
    npm run db:generate
    ```

4.  **Populate the Database:**

    You can populate the database with initial data by running the following script:

    ```bash
    cd apps/web
    npm run db:ingest
    ```

### Running the Application

To run the development server, use the following command:

```bash
npm run dev
```

The application will be available at [http://localhost:3001](http://localhost:3001).

### Other useful commands

*   `npm run build`: Build the application for production.
*   `npm run check-types`: Run the TypeScript compiler to check for type errors.
*   `npm run dev:web`: Start only the web application in development mode.

## Development Conventions

*   **Code Style:** The project uses Prettier for code formatting, which is likely run on save in the editor.
*   **Testing:** There are no explicit testing frameworks configured in the `package.json`, but there are scripts for testing search performance.
*   **Commits:** No explicit commit message convention is mentioned, but the project uses Git for version control.
*   **Branching:** No explicit branching strategy is mentioned.
