#!/bin/bash

# Configuration
API_URL="https://idiom.railway.internal"  # Replace with your actual domain
API_KEY="$1"  # Pass API key as first argument

if [ -z "$API_KEY" ]; then
    echo "Please provide the API key as an argument"
    echo "Usage: ./test-endpoints.sh YOUR_API_KEY"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to make requests and check responses
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local needs_auth=$4

    echo -e "\n${GREEN}Testing $description...${NC}"
    
    if [ "$needs_auth" = true ]; then
        response=$(curl -s -X $method -H "x-api-key: $API_KEY" "$API_URL$endpoint")
    else
        response=$(curl -s "$API_URL$endpoint")
    fi
    
    if [ $? -eq 0 ]; then
        echo "Response: $response"
        echo -e "${GREEN}✓ Success${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
        echo "Error: $response"
    fi
}

# Test all endpoints
echo "Starting endpoint tests..."

# 1. Health Check (no auth)
test_endpoint "GET" "/" "Health Check" false

# 2. Metrics (protected)
test_endpoint "GET" "/metrics" "Metrics" true

# 3. Manual Idioms Trigger (protected)
test_endpoint "POST" "/idiom" "Manual Idioms Trigger" true

# 4. Manual Phrases Trigger (protected)
test_endpoint "POST" "/how-to-say-this" "Manual Phrases Trigger" true

# 5. Test Webhook (protected)
test_endpoint "POST" "/test-webhook" "Webhook Test" true

echo -e "\n${GREEN}All tests completed!${NC}" 