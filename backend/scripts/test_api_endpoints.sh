#!/bin/bash

# Comprehensive API endpoint testing script
# Tests all major endpoints with the real PostgreSQL database

BASE_URL="http://localhost:8000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

# Function to test endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local token="$5"
    local expected_status="$6"

    echo -e "\n${BLUE}Testing:${NC} $test_name"
    echo "Request: $method $endpoint"

    if [ -z "$token" ]; then
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data")
        fi
    else
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" -H "Authorization: Bearer $token")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data")
        fi
    fi

    body=$(echo "$response" | sed '$d')
    status_code=$(echo "$response" | tail -n1)

    echo "Response Status: $status_code"
    echo "Response Body: $body" | head -c 200

    if [ "$status_code" = "$expected_status" ]; then
        print_result 0 "$test_name (Status: $status_code)"
    else
        print_result 1 "$test_name (Expected: $expected_status, Got: $status_code)"
    fi
}

# Read tokens from file
ACCESS_TOKEN=$(grep "Access Token:" scripts/test_tokens.txt | sed 's/Access Token: //')
REFRESH_TOKEN=$(grep "Refresh Token:" scripts/test_tokens.txt | sed 's/Refresh Token: //')
USER_ID=$(grep "User ID:" scripts/test_tokens.txt | sed 's/User ID: //')
ACCOUNT_1_ID=$(grep "Main Savings:" scripts/test_tokens.txt | sed 's/Main Savings: //')
ACCOUNT_2_ID=$(grep "Current Account:" scripts/test_tokens.txt | sed 's/Current Account: //')
GROUP_1_ID=$(grep "Banking:" scripts/test_tokens.txt | sed 's/Banking: //')

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}API Endpoint Testing Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "\nTesting against: $BASE_URL"
echo "User ID: $USER_ID"
echo -e "\n${YELLOW}Starting tests...${NC}\n"

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================
echo -e "\n${BLUE}======== AUTHENTICATION ENDPOINTS ========${NC}\n"

# Test 1: Login with correct credentials
test_endpoint \
    "Login with valid credentials" \
    "POST" \
    "/auth/login" \
    '{"email": "testuser@networthtracker.com", "password": "TestPassword123!"}' \
    "" \
    "200"

# Test 2: Get current user (authenticated)
test_endpoint \
    "Get current user profile" \
    "GET" \
    "/auth/me" \
    "" \
    "$ACCESS_TOKEN" \
    "200"

# Test 3: Get current user without authentication
test_endpoint \
    "Get current user without authentication (should fail)" \
    "GET" \
    "/auth/me" \
    "" \
    "" \
    "401"

# Test 4: Login with invalid credentials
test_endpoint \
    "Login with invalid password (should fail)" \
    "POST" \
    "/auth/login" \
    '{"email": "testuser@networthtracker.com", "password": "WrongPassword123!"}' \
    "" \
    "401"

# Test 5: Login with non-existent user
test_endpoint \
    "Login with non-existent user (should fail)" \
    "POST" \
    "/auth/login" \
    '{"email": "nonexistent@example.com", "password": "TestPassword123!"}' \
    "" \
    "401"

# Test 6: Refresh token
test_endpoint \
    "Refresh access token" \
    "POST" \
    "/auth/refresh" \
    "{\"refresh_token\": \"$REFRESH_TOKEN\"}" \
    "" \
    "200"

# ============================================================================
# ACCOUNT ENDPOINTS
# ============================================================================
echo -e "\n${BLUE}======== ACCOUNT ENDPOINTS ========${NC}\n"

# Test 7: Get all accounts (authenticated)
test_endpoint \
    "Get all user accounts" \
    "GET" \
    "/accounts" \
    "" \
    "$ACCESS_TOKEN" \
    "200"

# Test 8: Get specific account by ID
test_endpoint \
    "Get specific account by ID" \
    "GET" \
    "/accounts/$ACCOUNT_1_ID" \
    "" \
    "$ACCESS_TOKEN" \
    "200"

# Test 9: Get account without authentication (should fail)
test_endpoint \
    "Get accounts without authentication (should fail)" \
    "GET" \
    "/accounts" \
    "" \
    "" \
    "401"

# Test 10: Create new account
test_endpoint \
    "Create new account" \
    "POST" \
    "/accounts" \
    '{"account_name": "Test Savings Account", "currency": "GBP", "account_type": "savings"}' \
    "$ACCESS_TOKEN" \
    "201"

# Test 11: Create account with invalid currency
test_endpoint \
    "Create account with invalid currency (should fail)" \
    "POST" \
    "/accounts" \
    '{"account_name": "Invalid Account", "currency": "XXX", "account_type": "savings"}' \
    "$ACCESS_TOKEN" \
    "422"

# Test 12: Update account
test_endpoint \
    "Update account details" \
    "PUT" \
    "/accounts/$ACCOUNT_1_ID" \
    '{"account_name": "Updated Main Savings", "currency": "GBP", "account_type": "savings"}' \
    "$ACCESS_TOKEN" \
    "200"

# ============================================================================
# BALANCE ENDPOINTS
# ============================================================================
echo -e "\n${BLUE}======== BALANCE ENDPOINTS ========${NC}\n"

# Test 13: Get all balances for an account
test_endpoint \
    "Get all balances for account" \
    "GET" \
    "/accounts/$ACCOUNT_1_ID/balances" \
    "" \
    "$ACCESS_TOKEN" \
    "200"

# Test 14: Create new balance
test_endpoint \
    "Create new balance record" \
    "POST" \
    "/accounts/$ACCOUNT_1_ID/balances" \
    "{\"amount\": 19500.00, \"date\": \"$(date -u +%Y-%m-%d)\"}" \
    "$ACCESS_TOKEN" \
    "201"

# Test 15: Get balance by ID (using the first account)
test_endpoint \
    "Get specific balance by account ID" \
    "GET" \
    "/accounts/$ACCOUNT_1_ID/balances" \
    "" \
    "$ACCESS_TOKEN" \
    "200"

# Test 16: Create balance with missing fields
test_endpoint \
    "Create balance without required fields (should fail)" \
    "POST" \
    "/accounts/$ACCOUNT_1_ID/balances" \
    '{"amount": 1000.00}' \
    "$ACCESS_TOKEN" \
    "422"

# Test 17: Create balance for non-existent account
test_endpoint \
    "Create balance for non-existent account (should fail)" \
    "POST" \
    "/accounts/00000000-0000-0000-0000-000000000000/balances" \
    "{\"amount\": 1000.00, \"date\": \"$(date -u +%Y-%m-%d)\"}" \
    "$ACCESS_TOKEN" \
    "404"

# ============================================================================
# ACCOUNT GROUP ENDPOINTS
# ============================================================================
echo -e "\n${BLUE}======== ACCOUNT GROUP ENDPOINTS ========${NC}\n"

# Test 18: Get all account groups
test_endpoint \
    "Get all account groups" \
    "GET" \
    "/account-groups" \
    "" \
    "$ACCESS_TOKEN" \
    "200"

# Test 19: Get specific account group
test_endpoint \
    "Get specific account group by ID" \
    "GET" \
    "/account-groups/$GROUP_1_ID" \
    "" \
    "$ACCESS_TOKEN" \
    "200"

# Test 20: Create new account group
test_endpoint \
    "Create new account group" \
    "POST" \
    "/account-groups" \
    '{"name": "Test Group", "description": "A test account group"}' \
    "$ACCESS_TOKEN" \
    "201"

# Test 21: Create account group with accounts
test_endpoint \
    "Create account group with associated accounts" \
    "POST" \
    "/account-groups" \
    "{\"name\": "Retirement Funds", "description": "Retirement savings accounts", "accounts\": [\"$ACCOUNT_1_ID\"]}" \
    "$ACCESS_TOKEN" \
    "201"

# Test 22: Update account group
test_endpoint \
    "Update account group" \
    "PUT" \
    "/account-groups/$GROUP_1_ID" \
    '{"name": "Updated Banking Group", "description": "Updated description"}' \
    "$ACCESS_TOKEN" \
    "200"

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo -e "Total Tests Run: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi
