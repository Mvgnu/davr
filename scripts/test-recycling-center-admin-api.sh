#!/bin/bash

# Test script for the Recycling Center Admin API
# This script will test all CRUD operations for the recycling centers admin API

# API base URL - change this to match your deployment
BASE_URL="http://localhost:3000/api/admin"
# Auth token - you'll need to replace this with a valid admin session cookie
AUTH_COOKIE="next-auth.session-token=YOUR_ADMIN_SESSION_TOKEN_HERE"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Recycling Center Admin API${NC}"
echo -e "${YELLOW}===================================${NC}"

# Test 1: Get all recycling centers
echo -e "\n${YELLOW}Test 1: Get all recycling centers${NC}"
RESPONSE=$(curl -s -X GET \
  -H "Cookie: $AUTH_COOKIE" \
  "$BASE_URL/recycling-centers?page=1&limit=5")

# Check if response contains success: true
if [[ $RESPONSE == *'"success":true'* ]]; then
  echo -e "${GREEN}✓ Successfully retrieved recycling centers${NC}"
  
  # Extract the ID of the first recycling center for later tests
  CENTER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [[ -n $CENTER_ID ]]; then
    echo -e "${GREEN}✓ Found recycling center ID: $CENTER_ID for testing${NC}"
  else
    CENTER_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    if [[ -n $CENTER_ID ]]; then
      echo -e "${GREEN}✓ Found recycling center ID: $CENTER_ID for testing${NC}"
    else
      echo -e "${RED}✗ Could not extract a recycling center ID from response${NC}"
      echo "Response excerpt:"
      echo $RESPONSE | head -100
    fi
  fi
else
  echo -e "${RED}✗ Failed to retrieve recycling centers${NC}"
  echo "Response:"
  echo $RESPONSE
fi

# Test 2: Get a single recycling center
if [[ -n $CENTER_ID ]]; then
  echo -e "\n${YELLOW}Test 2: Get recycling center with ID $CENTER_ID${NC}"
  RESPONSE=$(curl -s -X GET \
    -H "Cookie: $AUTH_COOKIE" \
    "$BASE_URL/recycling-centers/$CENTER_ID")
  
  if [[ $RESPONSE == *'"success":true'* ]]; then
    echo -e "${GREEN}✓ Successfully retrieved recycling center${NC}"
  else
    echo -e "${RED}✗ Failed to retrieve recycling center${NC}"
    echo "Response:"
    echo $RESPONSE
  fi
fi

# Test 3: Create a new recycling center
echo -e "\n${YELLOW}Test 3: Create a new recycling center${NC}"
RESPONSE=$(curl -s -X POST \
  -H "Cookie: $AUTH_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Recycling Center",
    "address": "123 Test St",
    "city": "Test City",
    "postal_code": "12345",
    "state": "Test State",
    "description": "This is a test recycling center created by the API test script",
    "verification_status": "pending"
  }' \
  "$BASE_URL/recycling-centers")

if [[ $RESPONSE == *'"success":true'* ]]; then
  echo -e "${GREEN}✓ Successfully created recycling center${NC}"
  # Extract the ID for further tests
  NEW_CENTER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [[ -z $NEW_CENTER_ID ]]; then
    NEW_CENTER_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  fi
  
  if [[ -n $NEW_CENTER_ID ]]; then
    echo -e "${GREEN}✓ New recycling center ID: $NEW_CENTER_ID${NC}"
  else
    echo -e "${RED}✗ Could not extract the new recycling center ID${NC}"
    echo "Response excerpt:"
    echo $RESPONSE | head -100
  fi
else
  echo -e "${RED}✗ Failed to create recycling center${NC}"
  echo "Response:"
  echo $RESPONSE
fi

# Test 4: Update the recycling center
if [[ -n $NEW_CENTER_ID ]]; then
  echo -e "\n${YELLOW}Test 4: Update recycling center with ID $NEW_CENTER_ID${NC}"
  RESPONSE=$(curl -s -X PATCH \
    -H "Cookie: $AUTH_COOKIE" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Test Recycling Center",
      "description": "This recycling center was updated via the API test script",
      "verification_status": "verified",
      "materials": [1, 2, 3]
    }' \
    "$BASE_URL/recycling-centers/$NEW_CENTER_ID")
  
  if [[ $RESPONSE == *'"success":true'* ]]; then
    echo -e "${GREEN}✓ Successfully updated recycling center${NC}"
  else
    echo -e "${RED}✗ Failed to update recycling center${NC}"
    echo "Response:"
    echo $RESPONSE
  fi
fi

# Test 5: Delete the recycling center
if [[ -n $NEW_CENTER_ID ]]; then
  echo -e "\n${YELLOW}Test 5: Delete recycling center with ID $NEW_CENTER_ID${NC}"
  RESPONSE=$(curl -s -X DELETE \
    -H "Cookie: $AUTH_COOKIE" \
    "$BASE_URL/recycling-centers/$NEW_CENTER_ID")
  
  if [[ $RESPONSE == *'"success":true'* ]]; then
    echo -e "${GREEN}✓ Successfully deleted recycling center${NC}"
  else
    echo -e "${RED}✗ Failed to delete recycling center${NC}"
    echo "Response:"
    echo $RESPONSE
  fi
fi

echo -e "\n${YELLOW}API Testing Complete${NC}" 