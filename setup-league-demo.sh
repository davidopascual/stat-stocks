#!/bin/bash

echo "🏀 Setting up NBA Stock Market League Demo..."

# Register users
echo "📝 Registering users..."
USER1=$(curl -s -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "LeBron_Fan", "email": "lebron@example.com", "startingBalance": 100000}' \
  | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

USER2=$(curl -s -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "Curry_Investor", "email": "curry@example.com", "startingBalance": 100000}' \
  | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

USER3=$(curl -s -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "Giannis_Trader", "email": "giannis@example.com", "startingBalance": 100000}' \
  | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "✅ Created users: $USER1, $USER2, $USER3"

# Create league
echo "🏆 Creating league..."
LEAGUE_RESPONSE=$(curl -s -X POST http://localhost:3001/api/leagues/create \
  -H "Content-Type: application/json" \
  -d "{
    \"creatorId\": \"$USER1\",
    \"name\": \"NBA Elite Traders\",
    \"description\": \"Elite competition for the best NBA stock traders. Advanced features enabled!\",
    \"startingBalance\": 75000,
    \"settings\": {
      \"allowShortSelling\": true,
      \"allowOptions\": true,
      \"allowMargin\": true,
      \"maxLeverage\": 2,
      \"tradingFees\": true,
      \"feePercentage\": 0.25
    },
    \"isPrivate\": false
  }")

LEAGUE_ID=$(echo $LEAGUE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
INVITE_CODE=$(echo $LEAGUE_RESPONSE | grep -o '"inviteCode":"[^"]*"' | cut -d'"' -f4)

echo "✅ Created league: $LEAGUE_ID with invite code: $INVITE_CODE"

# Join league with other users
echo "👥 Adding members to league..."
curl -s -X POST http://localhost:3001/api/leagues/join \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER2\", \"inviteCode\": \"$INVITE_CODE\"}" > /dev/null

curl -s -X POST http://localhost:3001/api/leagues/join \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER3\", \"inviteCode\": \"$INVITE_CODE\"}" > /dev/null

echo "✅ All users joined the league"

# Display results
echo ""
echo "🎯 Demo Setup Complete!"
echo "📊 League ID: $LEAGUE_ID"
echo "🔑 Invite Code: $INVITE_CODE"
echo "👤 Users: LeBron_Fan, Curry_Investor, Giannis_Trader"
echo ""
echo "🌐 Test the leagues feature at: http://localhost:5174"
echo "📈 Check leaderboard: curl http://localhost:3001/api/leagues/$LEAGUE_ID/leaderboard"
echo ""
