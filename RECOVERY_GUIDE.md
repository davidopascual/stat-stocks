# NBA Stock Market - Setup & Recovery Guide

## Current Status

✅ **What's Working:**
- Backend server runs without crashes on port 3001
- WebSocket connections are established  
- Player price updates and NBA stats fetching work
- Auth routes and endpoints are defined
- Frontend successfully attempts to connect

❌ **What's Not Working:**
- Supabase integration - "Invalid API key" error
- User registration fails
- Portfolio/trading endpoints return 404 (users not found in DB)
- Frontend can't fetch portfolio data
- Leagues section is missing from frontend

## Root Cause

The Supabase client is configured correctly in code, but the API key is being rejected by Supabase. This means either:
1. The Supabase project's schema hasn't been applied yet
2. The API key needs to be regenerated
3. Row Level Security (RLS) policies are blocking requests

## Immediate Fix Steps

### Step 1: Verify/Reset Supabase Setup

1. Go to your Supabase project dashboard: https://aoyzungbezkavabxfdtp.supabase.co
2. Navigate to **SQL Editor**
3. Run the schema from `/server/supabase-schema-final.sql` (the file has been restored)
4. This will create all necessary tables: `users`, `positions`, `transactions`, `option_positions`, `leagues`, `league_memberships`

### Step 2: Verify API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the `anon` `public` key
3. Update `/server/.env` with the correct key:
   ```
   SUPABASE_URL=https://aoyzungbezkavabxfdtp.supabase.co
   SUPABASE_ANON_KEY=<your-actual-anon-key-here>
   ```
4. Restart the backend server

### Step 3: Test After Setup

Once Supabase is configured, test:

```bash
# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"Test1234!"}'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"testuser","password":"Test1234!"}'

# Test portfolio (use the user ID from registration response)
curl http://localhost:3001/api/portfolio/<USER_ID>
```

## Files Updated/Created

### Backend Files
- ✅ `/server/src/auth.ts` - Fully integrated with Supabase
- ✅ `/server/src/authRoutes.ts` - Updated for async auth functions
- ✅ `/server/src/supabase.ts` - Supabase client configuration
- ✅ `/server/src/userService.ts` - New service for user/portfolio operations
- ✅ `/server/src/indexV2.ts` - Updated portfolio endpoint to use Supabase
- ✅ `/server/supabase-schema-final.sql` - Complete database schema

### What Needs to Happen Next

1. **Apply the Supabase schema** (see Step 1 above)
2. **Verify/update the API key** (see Step 2 above)
3. **Update the trading endpoint** in `/server/src/indexV2.ts` to use `userService` instead of `leagueManager`
4. **Test all endpoints** to ensure they work with Supabase
5. **Commit all changes** to Git with a clear message

## Architecture Overview

```
Frontend (React) 
  ↓
Backend (Express on port 3001)
  ↓
├─ /api/auth/* → auth.ts → Supabase (users table)
├─ /api/portfolio/:userId → userService.ts → Supabase (positions, transactions)
├─ /api/trade → [NEEDS UPDATE] → Supabase
├─ /api/leagues/* → leagueManager.ts → Supabase (leagues table)
└─ WebSocket → Real-time price updates
```

## Key Integration Points

### Registration Flow:
1. User submits form → `/api/auth/register`
2. Backend hashes password with bcrypt
3. Inserts user into Supabase `users` table
4. Returns JWT token and user data
5. Frontend stores token and redirects to trading view

### Trading Flow:
1. User initiates trade → `/api/trade`
2. Backend validates user exists in Supabase
3. Updates user's `cash` balance
4. Creates/updates position in `positions` table
5. Logs transaction in `transactions` table
6. Returns updated portfolio

### Portfolio Flow:
1. Frontend requests → `/api/portfolio/:userId`
2. Backend fetches user + positions + transactions from Supabase
3. Updates current prices from price engine
4. Returns complete portfolio data

## Debugging Tips

If you still see "Invalid API key" errors:
1. Check the actual key in `.env` matches Supabase dashboard
2. Ensure you're using the `anon` key, not the `service_role` key
3. Try regenerating the key in Supabase dashboard
4. Check if RLS policies are too restrictive

If registration works but portfolio fails:
1. Check if user was actually inserted: `SELECT * FROM users;` in Supabase SQL Editor
2. Verify the user ID matches between registration response and portfolio request
3. Check server logs for detailed error messages

## Next Development Tasks (After Fix)

1. Update `/api/trade` endpoint to use `userService`
2. Ensure all leagueManager operations write to Supabase
3. Add proper error handling and validation
4. Implement WebSocket auth for secure real-time updates
5. Add frontend league management UI
6. Add portfolio visualization components
7. Implement proper session management
8. Add comprehensive testing

## Environment Variables Required

```env
# Backend .env
SUPABASE_URL=https://aoyzungbezkavabxfdtp.supabase.co
SUPABASE_ANON_KEY=<your-key-here>
JWT_SECRET=nba-stock-market-secret-key-change-in-production
PORT=3001

# Frontend .env (if needed)
VITE_API_URL=http://localhost:3001
```

## Success Criteria

✅ User can register and receive a JWT token
✅ User can log in with username or email
✅ Portfolio endpoint returns user's cash, positions, and transactions
✅ Trading endpoint can buy/sell shares and updates Supabase
✅ Frontend displays portfolio and league sections
✅ WebSocket provides real-time price updates
✅ All data persists across server restarts

---

**Last Updated:** October 20, 2025, 7:13 PM
**Backend Status:** Running on port 3001
**Blocking Issue:** Supabase API key validation
**Resolution:** Apply schema and verify API key in Supabase dashboard
