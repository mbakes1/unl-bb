# OCDS Caching Setup Instructions

This guide will help you set up the high-performance caching layer using Neon DB and Vercel.

## Prerequisites

1. **Neon DB Account**: Sign up at [console.neon.tech](https://console.neon.tech/)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com/)

## Step 1: Set Up Neon Database

1. **Create a Neon Project**:

   - Go to [Neon Console](https://console.neon.tech/)
   - Click "Create Project"
   - Choose a name (e.g., "ocds-cache")
   - Select your preferred region
   - Click "Create Project"

2. **Get Connection String**:

   - In your Neon dashboard, go to "Connection Details"
   - Copy the connection string (it looks like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`)

3. **Update Environment Variables**:
   ```bash
   # In apps/web/.env
   DATABASE_URL="your-neon-connection-string-here"
   CRON_SECRET="your-secure-random-string-here"
   ```

## Step 2: Initialize Database

1. **Push the schema to Neon**:

   ```bash
   cd apps/web
   npm run db:push
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

## Step 3: Initial Data Population

You have two options for populating your database:

### Option A: Manual Script (Recommended for initial setup)

```bash
cd apps/web
npm run db:ingest
```

### Option B: Test the API endpoint

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Visit: `http://localhost:3001/api/test-ingest`

## Step 4: Deploy to Vercel

1. **Connect your repository to Vercel**:

   - Go to [vercel.com](https://vercel.com/)
   - Import your GitHub repository
   - Set the root directory to `apps/web`

2. **Configure Environment Variables in Vercel**:

   - In your Vercel project dashboard, go to Settings > Environment Variables
   - Add:
     - `DATABASE_URL`: Your Neon connection string
     - `CRON_SECRET`: A secure random string

3. **Deploy**:
   - Vercel will automatically deploy your app
   - The cron job will start running automatically every 6 hours

## Step 5: Verify Everything Works

1. **Check the ingestion endpoint** (replace with your Vercel URL):

   ```bash
   curl -H "Authorization: Bearer your-cron-secret" https://your-app.vercel.app/api/ingest
   ```

2. **Test the API**:

   ```bash
   curl https://your-app.vercel.app/api/OCDSReleases?PageSize=5
   ```

3. **Check individual release**:
   ```bash
   curl https://your-app.vercel.app/api/OCDSReleases/release/[some-ocid]
   ```

## Performance Benefits

After setup, you should see:

- **Page load times**: From 3-5 seconds to under 500ms
- **Navigation**: Almost instant with Next.js prefetching
- **Reliability**: No dependency on external API uptime
- **Scalability**: Handles traffic spikes without issues

## Monitoring and Maintenance

1. **Monitor cron jobs**: Check Vercel Functions tab for cron execution logs
2. **Database usage**: Monitor your Neon dashboard for storage and compute usage
3. **Adjust cron frequency**: Edit `vercel.json` to change the schedule (currently every 6 hours)

## Troubleshooting

### Common Issues:

1. **"Database does not exist"**:

   - Make sure you ran `npm run db:push`
   - Verify your DATABASE_URL is correct

2. **"Unauthorized" on cron endpoint**:

   - Check that CRON_SECRET matches in both .env and Vercel environment variables

3. **TypeScript errors**:

   - Run `npm run db:generate` to regenerate Prisma client
   - Restart your TypeScript server in VS Code

4. **No data showing**:
   - Check if ingestion ran successfully: visit `/api/test-ingest`
   - Verify external API is accessible

### Performance Tuning:

1. **Increase cron frequency** for fresher data:

   ```json
   // vercel.json - run every hour
   "schedule": "0 * * * *"
   ```

2. **Adjust page sizes** for better performance:

   - Current default: 50 items per page
   - Maximum: 100 items per page

3. **Add more indexes** if needed:
   ```prisma
   // Add to schema.prisma if you need specific filtering
   @@index([title])
   @@index([status, releaseDate])
   ```

## Cost Estimation

- **Neon DB**: Free tier includes 0.5 GB storage, 1 compute hour/month
- **Vercel**: Free tier includes 100 GB bandwidth, 1000 cron executions/month
- **Expected monthly cost**: $0 for small to medium usage

For production with higher traffic, expect $5-20/month total.
