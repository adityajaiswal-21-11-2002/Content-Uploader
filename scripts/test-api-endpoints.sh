#!/bin/bash

# API Endpoint Testing Script
# Tests all API endpoints using curl
# 
# Usage: bash scripts/test-api-endpoints.sh
# Make sure your dev server is running first

BASE_URL="${TEST_BASE_URL:-http://192.168.29.42:3000}"
CRON_SECRET="${CRON_SECRET:-test-secret}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth=$5
    
    echo -e "${CYAN}Testing: ${name}${NC}"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $auth" "${BASE_URL}${endpoint}")
        else
            response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
        fi
    else
        if [ -n "$auth" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$data" "${BASE_URL}${endpoint}")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "${BASE_URL}${endpoint}")
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS: ${name} (HTTP $http_code)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAIL: ${name} (HTTP $http_code)${NC}"
        echo "   Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

echo -e "${BLUE}🧪 Testing API Endpoints${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo -e "${BLUE}=================================${NC}\n"

# Test 1: Server health check
test_endpoint "Server Health Check" "GET" "/api/employees"

# Test 2: Database initialization
test_endpoint "Database Initialization" "GET" "/api/init"

# Test 3: Get employees
test_endpoint "Get Employees" "GET" "/api/employees"

# Test 4: Get today's topics
test_endpoint "Get Today's Topics" "GET" "/api/topics/today/1"

# Test 5: Weekly summary
test_endpoint "Weekly Summary" "GET" "/api/uploads/week-summary"

# Test 6: Mark upload done
test_endpoint "Mark Upload Done" "POST" "/api/upload/mark-done" '{"employee_id":1,"platform":"youtube"}'

# Test 7: Send alert
test_endpoint "Send Alert Email" "POST" "/api/email/send-alert" '{"employee_id":1}'

# Test 8: Cron - Daily topics
test_endpoint "Cron: Daily Topics" "GET" "/api/cron/daily-topics" "" "$CRON_SECRET"

# Test 9: Cron - Weekly check
test_endpoint "Cron: Weekly Check" "GET" "/api/cron/weekly-check" "" "$CRON_SECRET"

# Summary
echo -e "${BLUE}=================================${NC}"
echo -e "${CYAN}📋 Test Summary${NC}"
echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo -e "${BLUE}📊 Total:  $((PASSED + FAILED))${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed${NC}"
    exit 1
fi

