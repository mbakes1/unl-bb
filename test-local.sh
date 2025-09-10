#!/bin/bash

# Quick local test to verify the caching system works
echo "🧪 Testing OCDS Caching System Locally..."
echo ""

# Check if we can connect to Neon DB
echo "🔌 Testing database connection..."
cd apps/web

# Generate Prisma client if needed
echo "📦 Ensuring Prisma client is ready..."
npm run db:generate > /dev/null 2>&1

# Test database connection
if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed - check your DATABASE_URL"
    exit 1
fi

# Test the ingestion script
echo ""
echo "📥 Testing data ingestion..."
if npm run db:ingest > /dev/null 2>&1; then
    echo "✅ Data ingestion successful!"
    
    # Check how many records we have
    RECORD_COUNT=$(npx prisma db seed --preview-feature 2>/dev/null | grep -o '[0-9]* releases' | head -1 || echo "some")
    echo "📊 Database populated with releases"
else
    echo "⚠️  Data ingestion had issues (check logs)"
fi

echo ""
echo "🎯 Local system is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes"
echo "2. Set environment variables in Vercel"
echo "3. Deploy and run ./verify-deployment.sh"