# 🎯 Browser Testing Guide

## Prerequisites
✅ Backend server running on http://localhost:3001
✅ Frontend server running on http://localhost:5173
✅ All fixes applied to prevent crashes

## Testing Steps

### 1. Open the Application
Go to: **http://localhost:5173**

### 2. Register a New User
1. Click "Sign Up" or navigate to registration
2. Fill in:
   - Username: `testuser3`
   - Email: `test3@example.com`
   - Display Name: `Test User 3`
   - Password: `test123`
3. Click "Register"
4. ✅ You should be logged in automatically

### 3. Verify Dashboard
After login, check:
- ✅ Your name appears in top right
- ✅ Cash balance shows $10,000.00
- ✅ Total portfolio value shows correctly
- ✅ No errors in browser console (F12)

### 4. Test Stock Trading
1. Click on any player in the market view
2. Try buying 10 shares
3. ✅ Transaction should succeed
4. ✅ Balance should decrease
5. ✅ Player should appear in your portfolio
6. Try selling 5 shares
7. ✅ Balance should increase
8. ✅ Position should update

### 5. Test League Creation
1. Click "Leagues" tab
2. Click "Create New League"
3. Fill in:
   - League Name: `Test League`
   - Description: `Testing leagues`
   - Starting Balance: `10000`
4. Click "Create League"
5. ✅ League should appear in your list
6. ✅ Invite code should be displayed
7. ✅ "Creator" badge should show

### 6. Test League Joining (Optional - requires 2nd user)
1. Open in incognito/private window: http://localhost:5173
2. Register another user (testuser4)
3. Go to Leagues tab
4. Click "Join League"
5. Paste invite code from first user
6. ✅ Should successfully join
7. ✅ League should appear in both users' league lists

### 7. Check Real-time Updates
1. Keep the app open for ~30 seconds
2. ✅ Player prices should update automatically
3. ✅ WebSocket connection indicator (check console) should show "connected"
4. ✅ No repeated connection/disconnection errors

## What to Look For

### ✅ Success Indicators
- No crashes or blank screens
- Balance displays without errors
- Trades execute successfully
- Leagues can be created and joined
- Portfolio updates correctly
- No recurring errors in console

### ⚠️ Expected Console Messages (SAFE to ignore)
- "WebSocket connected" - Good!
- "No user logged in - skipping portfolio initialization" - Normal before login
- "WebSocket connected for portfolio updates" - Good after login
- Price update messages every 30 seconds - Expected

### ❌ Problems to Report
- "Cannot read properties of undefined" errors
- "404 Not Found" errors
- Crashes or blank screens
- Features not working
- Repeated connection failures

## Quick Fixes If Issues Occur

### If balance shows as $0 or undefined:
1. Logout and login again
2. Check browser console for errors
3. Verify backend is running: `lsof -i :3001`

### If portfolio doesn't load:
1. Check Network tab in DevTools
2. Look for failed /api/portfolio requests
3. Verify you're logged in (check localStorage: user key)

### If leagues don't work:
1. Check backend logs
2. Try creating with all required fields
3. Verify invite code is copied correctly

## Testing Checklist

- [ ] App loads without crashing
- [ ] Can register new user
- [ ] Can login with existing user
- [ ] Balance displays correctly
- [ ] Can view market/players
- [ ] Can buy stocks
- [ ] Can sell stocks
- [ ] Portfolio updates correctly
- [ ] Can create league
- [ ] Invite code is shown
- [ ] Can join league (with 2nd user)
- [ ] WebSocket connects successfully
- [ ] No repeated errors in console

## Success! 🎉

If all checkboxes are checked, the app is fully functional!

Your friends can now:
1. Register accounts
2. Trade NBA player stocks
3. Create private leagues
4. Compete on leaderboards
5. Track their portfolios

## Share with Friends

Send them:
1. The URL: **http://localhost:5173** (or your deployed URL)
2. Instructions to register
3. Your league invite code to join your league

**Note:** For production deployment, make sure to:
- Set up Supabase with the schema
- Update .env with production keys
- Deploy backend to Heroku/Railway
- Deploy frontend to Vercel/Netlify
