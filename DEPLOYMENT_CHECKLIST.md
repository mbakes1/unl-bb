# Deployment Checklist for OCDS Caching System

## Current Status

✅ Database schema created  
✅ API routes updated  
✅ Prisma client generated  
❌ **Code not deployed to Vercel yet**  
❌ **Environment variables not set in Vercel**

## Steps to Deploy

### 1. Commit and Push Your Changes

```bash
# Add all the new files
git add .

# Commit the changes
git commit -m "feat: implement OCDS caching with Neon DB and Prisma

- Add Prisma schema for OCDS releases
- Create data ingestion API with cron job support
- Update API routes to query local database instead of proxy
- Add test endpoints for development
- Configure Vercel cron jobs"

# Push to your repository
git push origin main
```

### 2. Configure Environment Variables in Vercel

Go to your Vercel dashboard: https://vercel.com/dashboard

1. **Navigate to your project**: `unl-bb-web`
2. **Go to Settings > Environment Variables**
3. **Add these variables**:

| Variable Name  | Value                                                                                                                                                   | Environment                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_GYoj9ytJuI2z@ep-cold-hill-ag2efvc0-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Production, Preview, Development |
| `CRON_SECRET`  | `ocds-cache-secure-2024-kiro-neon-db-protection`                                                                                                        | Production, Preview, Development |

### 3. Trigger a New Deployment

After setting environment variables:

1. **Go to Deployments tab**
2. **Click "Redeploy" on the latest deployment**
3. **Wait for deployment to complete**

### 4. Verify Deployment

Once deployed, test these endpoints:

```bash
# Test the ingestion (should work now)
curl -H "Authorization: Bearer ocds-cache-secure-2024-kiro-neon-db-protection" https://unl-bb-web.vercel.app/api/ingest

# Test the main API (should return data from database)
curl "https://unl-bb-web.vercel.app/api/OCDSReleases?PageSize=5"

# Test individual release (replace OCID with actual one from above)
curl "https://unl-bb-web.vercel.app/api/OCDSReleases/release/[OCID]"
```

## Expected Results After Deployment

### ✅ Successful Ingestion Response:

```json
{
  "success": true,
  "fetched": 100,
  "upserted": 100,
  "timestamp": "2024-01-XX..."
}
```

### ✅ Successful API Response:

```json
{
  "releases": [...],
  "links": {
    "next": "/api/OCDSReleases?PageNumber=2&PageSize=5"
  }
}
```

## Troubleshooting

### If you get "Database does not exist" error:

The database schema needs to be pushed to Neon. This should happen automatically on first deployment, but if not:

1. **Run locally first**:

   ```bash
   cd apps/web
   npm run db:push
   ```

2. **Or trigger via API** (after deployment):
   ```bash
   curl https://unl-bb-web.vercel.app/api/test-ingest
   ```

### If you get "Unauthorized" on cron endpoint:

- Check that `CRON_SECRET` is set correctly in Vercel
- Make sure the Authorization header matches exactly

### If API still returns proxy errors:

- Verify the new code was deployed (check deployment logs)
- Ensure environment variables are set for all environments
- Try a hard refresh or clear cache

## Performance Monitoring

After successful deployment, monitor:

1. **Vercel Functions**: Check execution time and errors
2. **Neon Dashboard**: Monitor database usage and performance
3. **Cron Jobs**: Verify they run every 6 hours as scheduled

## Next Steps After Deployment

1. **Populate initial data**: The cron job will run automatically, but for immediate testing, trigger manual ingestion
2. **Monitor performance**: Check page load times - should be under 500ms
3. **Adjust cron frequency**: If needed, modify `vercel.json` schedule
4. **Scale database**: Upgrade Neon plan if you hit limits

---

**Current Vercel URL**: https://unl-bb-web.vercel.app/  
**Expected Performance**: 3-5 seconds → Under 500ms page loads
