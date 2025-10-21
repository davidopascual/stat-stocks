# 🏀 StatStocks - NBA Stock Market Game

Welcome to StatStocks! Trade NBA players like stocks based on their real-time performance.

## 🚀 Quick Start (For Your Friends)

### Option 1: One-Command Start (Easiest)
```bash
./run-both.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend  
npm install
npm run dev
```

## 🎮 How to Use

1. **Open your browser** to http://localhost:5173
2. **Create an account** - Click "Create one" on the login screen
3. **Start trading!** - You'll get $10,000 starting balance

### Features Available Now:
- ✅ **User Authentication** - Sign up and login
- ✅ **Live Market** - Real-time player prices
- ✅ **Trading** - Buy and sell player shares
- ✅ **Portfolio** - Track your holdings and performance
- ✅ **Leagues** - Create or join leagues with friends
- ✅ **Transactions** - View your trading history

## 🎯 Trading Basics

### Buying Shares
1. Go to the **Market** tab
2. Click on any player card
3. Enter the number of shares
4. Click **Buy**

### Selling Shares
1. Go to your **Portfolio**
2. Click on any position
3. Enter shares to sell
4. Click **Sell**

### Creating a League
1. Go to the **Leagues** tab
2. Click **+ Create League**
3. Set the name, description, and rules
4. Share the league ID with friends!

## 💡 Tips

- **Watch for Volatility**: Prices change based on player performance
- **Diversify**: Don't put all your money in one player
- **Check Stats**: Click on players to see detailed stats
- **Track Performance**: Monitor your portfolio value over time
- **Compete**: Join leagues to compete with friends

## 🔧 Troubleshooting

### "Can't connect to server"
- Make sure the backend is running on port 3001
- Check if another app is using the port

### "Login doesn't work"
- The app works WITHOUT Supabase (uses in-memory storage)
- Your data will be saved while servers are running
- To persist data permanently, set up Supabase (see SETUP_GUIDE.md)

### Ports in Use
If you get port errors:
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

## 📱 What's Next?

Coming soon:
- [ ] Short selling
- [ ] Options trading
- [ ] Live game integration
- [ ] Real NBA stats
- [ ] Mobile app
- [ ] Push notifications

## 🎮 Game Modes

### Solo Mode
- Start with $10,000
- Trade freely
- Track your performance

### League Mode
- Custom starting balance
- Compete with friends
- Leaderboards
- Custom rules (shorts, options, etc.)

## 🏆 Strategy Tips

1. **Buy Low, Sell High** - Wait for dips to buy
2. **Research Players** - Check recent performance
3. **Set Limits** - Don't risk everything
4. **Watch the Market** - Prices update in real-time
5. **Long-term Holds** - Star players tend to rise

## 📊 Understanding Prices

Prices change based on:
- Game performance
- Recent stats  
- Market demand
- Trading volume
- Volatility

## 🤝 Multiplayer

### Creating a League
- Set custom rules
- Choose starting balance
- Enable/disable advanced features

### Joining a League
- Get the league ID from creator
- Click "Join League"
- Start competing!

## 🎨 Interface Guide

### Market View
- See all available players
- Real-time price updates
- Quick buy buttons

### Portfolio View
- Your current holdings
- Total value
- Individual positions
- P&L (Profit/Loss)

### Player Detail
- Detailed stats
- Price chart
- Trade interface
- Recent transactions

## 🔒 Privacy & Data

- Your account data is stored securely
- Passwords are hashed
- JWT authentication
- Local storage for sessions

## ❓ FAQ

**Q: Do I need real money?**
A: No! It's all virtual trading with fake money.

**Q: Are prices based on real games?**
A: Currently simulated, but real NBA stats integration is coming!

**Q: Can I play with friends?**
A: Yes! Create a league and invite them.

**Q: What if I lose all my money?**
A: You can always reset or join a new league!

## 🎉 Have Fun!

This is a work in progress. Bugs and features will come and go. 

**Found a bug?** Let the developer know!
**Have an idea?** Share it!

Enjoy trading! 🚀📈
