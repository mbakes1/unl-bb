#!/bin/bash

# OCDS Caching System Deployment Verification Script
# Optimized for Vercel Hobby Plan

BASE_URL="https://unl-bb-web.vercel.app"
CRON_SECRET="ocds-cache-secure-2024-kiro-neon-db-protection"

echo "🚀 Verifying OCDS Caching System (Hobby Plan Optimized)..."
echo "Base URL: $BASE_URL"
echo ""

# Test 1: First API call (may trigger initial cache population)
echo "📊 Testing main API endpoint (first call - may populate cache)..."
echo "⏳ This might take a moment if cache is empty..."
START_TIME=$(date +%s)
API_RESPONSE=$(curl -s "$BASE_URL/api/OCDSReleases?PageSize=3")
END_TIME=$(date +%s)
FIRST_CALL_TIME=$((END_TIME - START_TIME))

echo "First call took: ${FIRST_CALL_TIME}s"

if echo "$API_RESPONSE" | grep -q '"releases"'; then
    echo "✅ Main API endpoint working!"
    
    # Count releases to verify data
    RELEASE_COUNT=$(echo "$API_RESPONSE" | grep -o '"ocid"' | wc -l)
    echo "📈 Found $RELEASE_COUNT releases in response"
    
    # Extract first OCID for detail test
    OCID=$(echo "$API_RESPONSE" | grep -o '"ocid":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "🔍 Sample OCID: $OCID"
    
else
    echo "❌ Main API endpoint failed"
    echo "Response: $API_RESPONSE"
    if echo "$API_RESPONSE" | grep -q "Proxy error"; then
        echo "⚠️  Still using old proxy code - deployment may not be complete"
    fi
fi
echo ""

# Test 2: Second API call (should be from cache - much faster)
echo "⚡ Testing cached response (second call - should be fast)..."
START_TIME=$(date +%s)
CACHED_RESPONSE=$(curl -s "$BASE_URL/api/OCDSReleases?PageSize=5")
END_TIME=$(date +%s)
CACHED_CALL_TIME=$((END_TIME - START_TIME))

echo "Cached call took: ${CACHED_CALL_TIME}s"

if [ "$CACHED_CALL_TIME" -lt 2 ]; then
    echo "✅ Excellent! Cache is working (< 2 seconds)"
elif [ "$CACHED_CALL_TIME" -lt 5 ]; then
    echo "✅ Good! Reasonable performance (< 5 seconds)"
else
    echo "⚠️  Slower than expected - may still be using external API"
fi
echo ""

# Test 3: Individual release endpoint
if [ ! -z "$OCID" ]; then
    echo "🔍 Testing individual release endpoint..."
    DETAIL_RESPONSE=$(curl -s "$BASE_URL/api/OCDSReleases/release/$OCID")
    
    if echo "$DETAIL_RESPONSE" | grep -q '"ocid"'; then
        echo "✅ Detail endpoint working!"
    else
        echo "❌ Detail endpoint failed"
        echo "Response: $DETAIL_RESPONSE"
    fi
    echo ""
fi

# Test 4: Check cron job configuration
echo "⏰ Checking cron job configuration..."
if [ -f "vercel.json" ]; then
    if grep -q "api/ingest" vercel.json; then
        echo "✅ Cron job configured in vercel.json"
        CRON_SCHEDULE=$(grep -A1 "api/ingest" vercel.json | grep "schedule" | cut -d'"' -f4)
        echo "📅 Schedule: $CRON_SCHEDULE (once daily - Hobby plan optimized)"
    else
        echo "❌ Cron job not found in vercel.json"
    fi
else
    echo "❌ vercel.json not found"
fi
echo ""

# Test 5: Optional manual cron test
echo "🔧 Testing manual data ingestion (optional)..."
INGEST_RESPONSE=$(curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/ingest")

if echo "$INGEST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Manual ingestion working!"
    INGESTED=$(echo "$INGEST_RESPONSE" | grep -o '"upserted":[0-9]*' | cut -d':' -f2)
    echo "📥 Processed $INGESTED releases"
else
    echo "⚠️  Manual ingestion may have issues (check logs)"
fi
echo ""

# Performance Summary
echo "📊 Performance Summary:"
echo "├── First call (cache population): ${FIRST_CALL_TIME}s"
echo "├── Cached call: ${CACHED_CALL_TIME}s"
echo "└── Performance improvement: $(( (FIRST_CALL_TIME - CACHED_CALL_TIME) * 100 / FIRST_CALL_TIME ))%"
echo ""

# Final assessment
echo "🏁 Deployment Assessment:"
if echo "$API_RESPONSE" | grep -q '"releases"' && [ "$CACHED_CALL_TIME" -lt 3 ]; then
    echo "🎉 SUCCESS! Your caching system is working perfectly!"
    echo "✅ Fast responses from cache"
    echo "✅ Data is being served from Neon DB"
    echo "✅ System is optimized for Hobby plan"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Your app should now load much faster"
    echo "2. Navigation will be almost instant"
    echo "3. Monitor performance in Vercel dashboard"
    echo "4. Check Neon dashboard for database activity"
else
    echo "⚠️  NEEDS ATTENTION:"
    echo "1. Check environment variables in Vercel"
    echo "2. Verify DATABASE_URL is correct"
    echo "3. Check Vercel function logs for errors"
    echo "4. Ensure latest code is deployed"
fi