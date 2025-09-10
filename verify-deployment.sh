#!/bin/bash

# OCDS Caching System Deployment Verification Script
# Run this after deploying to Vercel

BASE_URL="https://unl-bb-web.vercel.app"
CRON_SECRET="ocds-cache-secure-2024-kiro-neon-db-protection"

echo "🚀 Verifying OCDS Caching System Deployment..."
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Check if ingestion endpoint exists and works
echo "📥 Testing data ingestion endpoint..."
INGEST_RESPONSE=$(curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/ingest")
echo "Response: $INGEST_RESPONSE"

if echo "$INGEST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Ingestion endpoint working!"
else
    echo "❌ Ingestion endpoint failed"
fi
echo ""

# Test 2: Check main API endpoint
echo "📊 Testing main API endpoint..."
API_RESPONSE=$(curl -s "$BASE_URL/api/OCDSReleases?PageSize=3")
echo "Response: $API_RESPONSE"

if echo "$API_RESPONSE" | grep -q '"releases"'; then
    echo "✅ Main API endpoint working!"
    
    # Extract first OCID for detail test
    OCID=$(echo "$API_RESPONSE" | grep -o '"ocid":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "Found OCID for testing: $OCID"
    
    if [ ! -z "$OCID" ]; then
        echo ""
        echo "🔍 Testing individual release endpoint..."
        DETAIL_RESPONSE=$(curl -s "$BASE_URL/api/OCDSReleases/release/$OCID")
        
        if echo "$DETAIL_RESPONSE" | grep -q '"ocid"'; then
            echo "✅ Detail endpoint working!"
        else
            echo "❌ Detail endpoint failed"
            echo "Response: $DETAIL_RESPONSE"
        fi
    fi
else
    echo "❌ Main API endpoint failed"
    if echo "$API_RESPONSE" | grep -q "Proxy error"; then
        echo "⚠️  Still using old proxy code - deployment may not be complete"
    fi
fi
echo ""

# Test 3: Check if cron job configuration exists
echo "⏰ Checking cron job configuration..."
if [ -f "vercel.json" ]; then
    if grep -q "api/ingest" vercel.json; then
        echo "✅ Cron job configured in vercel.json"
    else
        echo "❌ Cron job not found in vercel.json"
    fi
else
    echo "❌ vercel.json not found"
fi
echo ""

# Test 4: Performance check
echo "⚡ Testing performance..."
START_TIME=$(date +%s%N)
PERF_RESPONSE=$(curl -s -w "%{time_total}" "$BASE_URL/api/OCDSReleases?PageSize=10" -o /dev/null)
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(echo "scale=3; ($END_TIME - $START_TIME) / 1000000000" | bc -l 2>/dev/null || echo "N/A")

echo "Response time: ${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l 2>/dev/null || echo 0) )); then
    echo "✅ Performance looks good! (< 1 second)"
else
    echo "⚠️  Response time could be better"
fi
echo ""

echo "🏁 Verification complete!"
echo ""
echo "Next steps:"
echo "1. If all tests pass: Your caching system is working! 🎉"
echo "2. If tests fail: Check the deployment checklist and environment variables"
echo "3. Monitor the cron job in Vercel Functions dashboard"
echo "4. Check Neon dashboard for database activity"