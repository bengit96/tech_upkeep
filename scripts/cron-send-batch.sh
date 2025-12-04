#!/bin/bash

# Cron-compatible script for sending newsletter batches
# This script should be called repeatedly by your cron job
# It will send one batch per invocation and exit
#
# Example cron entry (sends batch every 2 minutes):
# */2 * * * * cd /path/to/tech_upkeep && ./scripts/cron-send-batch.sh >> /var/log/newsletter-cron.log 2>&1
#
# The script will automatically detect when all users have been sent to

# Configuration
API_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
BATCH_SIZE="${NEWSLETTER_BATCH_SIZE:-20}"
DRAFT_ID="${NEWSLETTER_DRAFT_ID:-}"

# Load admin JWT token from environment or .env file
if [ -f .env.local ]; then
  export $(cat .env.local | grep ADMIN_JWT_TOKEN | xargs)
fi

if [ -z "$ADMIN_JWT_TOKEN" ]; then
  echo "❌ Error: ADMIN_JWT_TOKEN not set"
  exit 1
fi

# Build the request payload
if [ -n "$DRAFT_ID" ]; then
  PAYLOAD="{\"draftId\": $DRAFT_ID, \"batchSize\": $BATCH_SIZE}"
else
  PAYLOAD="{\"batchSize\": $BATCH_SIZE}"
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - Sending newsletter batch (batch size: $BATCH_SIZE)"

# Send the batch
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: token=$ADMIN_JWT_TOKEN" \
  -d "$PAYLOAD" \
  "$API_URL/api/admin/send-newsletter")

# Parse response
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
SENT=$(echo "$RESPONSE" | jq -r '.sent // 0')
FAILED=$(echo "$RESPONSE" | jq -r '.failed // 0')
REMAINING=$(echo "$RESPONSE" | jq -r '.remaining // 0')
IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.isComplete // false')
MESSAGE=$(echo "$RESPONSE" | jq -r '.message // "No message"')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Success: $MESSAGE"
  echo "   Sent: $SENT, Failed: $FAILED, Remaining: $REMAINING"

  if [ "$IS_COMPLETE" = "true" ]; then
    echo "🎉 All batches complete! No more users to send to."
    exit 0
  else
    echo "📦 More batches pending. Will send next batch on next cron run."
    exit 0
  fi
else
  echo "❌ Failed: $MESSAGE"
  echo "Response: $RESPONSE"
  exit 1
fi
