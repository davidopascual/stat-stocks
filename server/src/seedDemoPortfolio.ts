/**
 * Seed Demo Portfolio Script
 * Run this to populate a demo portfolio with sample trades for screenshots
 *
 * Usage: npx tsx src/seedDemoPortfolio.ts
 */

// This script creates a POST endpoint you can call to seed demo data
// Add this to your indexHybrid.ts file:

/*

// Add this endpoint to your indexHybrid.ts after the other routes:

app.post('/api/seed-demo', (req, res) => {
  const userId = req.body.userId || 'demo-user';

  // Get or create portfolio
  let portfolio = portfolios.get(userId);
  if (!portfolio) {
    portfolio = {
      userId,
      cash: 100000,
      holdings: [],
      totalValue: 100000,
      transactions: []
    };
  }

  // Clear existing holdings
  portfolio.holdings = [];
  portfolio.transactions = [];

  // Find some popular players
  const lebron = players.find(p => p.name.includes('LeBron'));
  const curry = players.find(p => p.name.includes('Curry'));
  const durant = players.find(p => p.name.includes('Durant'));
  const giannis = players.find(p => p.name.includes('Giannis'));
  const jokic = players.find(p => p.name.includes('Jokic'));
  const embiid = players.find(p => p.name.includes('Embiid'));
  const tatum = players.find(p => p.name.includes('Tatum'));

  // Add positions with realistic avg buy prices (slightly different from current)
  const demoHoldings = [
    {
      playerId: lebron?.id || players[0].id,
      playerName: lebron?.name || players[0].name,
      shares: 25,
      avgBuyPrice: (lebron?.currentPrice || players[0].currentPrice) * 0.85 // bought at 15% discount, showing profit
    },
    {
      playerId: curry?.id || players[1].id,
      playerName: curry?.name || players[1].name,
      shares: 30,
      avgBuyPrice: (curry?.currentPrice || players[1].currentPrice) * 0.92 // bought at 8% discount
    },
    {
      playerId: durant?.id || players[2].id,
      playerName: durant?.name || players[2].name,
      shares: 20,
      avgBuyPrice: (durant?.currentPrice || players[2].currentPrice) * 1.05 // bought at 5% premium, showing loss
    },
    {
      playerId: giannis?.id || players[3].id,
      playerName: giannis?.name || players[3].name,
      shares: 15,
      avgBuyPrice: (giannis?.currentPrice || players[3].currentPrice) * 0.88 // 12% profit
    },
    {
      playerId: jokic?.id || players[4].id,
      playerName: jokic?.name || players[4].name,
      shares: 18,
      avgBuyPrice: (jokic?.currentPrice || players[4].currentPrice) * 0.95 // 5% profit
    },
    {
      playerId: embiid?.id || players[5].id,
      playerName: embiid?.name || players[5].name,
      shares: 12,
      avgBuyPrice: (embiid?.currentPrice || players[5].currentPrice) * 1.08 // 8% loss
    },
    {
      playerId: tatum?.id || players[6].id,
      playerName: tatum?.name || players[6].name,
      shares: 22,
      avgBuyPrice: (tatum?.currentPrice || players[6].currentPrice) * 0.90 // 10% profit
    }
  ];

  portfolio.holdings = demoHoldings;

  // Calculate total value
  let holdingsValue = 0;
  portfolio.holdings.forEach(holding => {
    const player = players.find(p => p.id === holding.playerId);
    if (player) {
      holdingsValue += holding.shares * player.currentPrice;
    }
  });

  // Set realistic cash amount (spent about $50k on stocks)
  portfolio.cash = 47000;
  portfolio.totalValue = portfolio.cash + holdingsValue;

  // Add some transaction history
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  portfolio.transactions = [
    {
      id: `tx-${Date.now()}-1`,
      userId,
      playerId: lebron?.id || players[0].id,
      playerName: lebron?.name || players[0].name,
      type: 'BUY',
      shares: 25,
      price: (lebron?.currentPrice || players[0].currentPrice) * 0.85,
      total: 25 * (lebron?.currentPrice || players[0].currentPrice) * 0.85,
      timestamp: now - 7 * oneDayMs
    },
    {
      id: `tx-${Date.now()}-2`,
      userId,
      playerId: curry?.id || players[1].id,
      playerName: curry?.name || players[1].name,
      type: 'BUY',
      shares: 30,
      price: (curry?.currentPrice || players[1].currentPrice) * 0.92,
      total: 30 * (curry?.currentPrice || players[1].currentPrice) * 0.92,
      timestamp: now - 6 * oneDayMs
    },
    {
      id: `tx-${Date.now()}-3`,
      userId,
      playerId: durant?.id || players[2].id,
      playerName: durant?.name || players[2].name,
      type: 'BUY',
      shares: 20,
      price: (durant?.currentPrice || players[2].currentPrice) * 1.05,
      total: 20 * (durant?.currentPrice || players[2].currentPrice) * 1.05,
      timestamp: now - 5 * oneDayMs
    },
    {
      id: `tx-${Date.now()}-4`,
      userId,
      playerId: giannis?.id || players[3].id,
      playerName: giannis?.name || players[3].name,
      type: 'BUY',
      shares: 15,
      price: (giannis?.currentPrice || players[3].currentPrice) * 0.88,
      total: 15 * (giannis?.currentPrice || players[3].currentPrice) * 0.88,
      timestamp: now - 4 * oneDayMs
    },
    {
      id: `tx-${Date.now()}-5`,
      userId,
      playerId: jokic?.id || players[4].id,
      playerName: jokic?.name || players[4].name,
      type: 'BUY',
      shares: 18,
      price: (jokic?.currentPrice || players[4].currentPrice) * 0.95,
      total: 18 * (jokic?.currentPrice || players[4].currentPrice) * 0.95,
      timestamp: now - 3 * oneDayMs
    },
    {
      id: `tx-${Date.now()}-6`,
      userId,
      playerId: embiid?.id || players[5].id,
      playerName: embiid?.name || players[5].name,
      type: 'BUY',
      shares: 12,
      price: (embiid?.currentPrice || players[5].currentPrice) * 1.08,
      total: 12 * (embiid?.currentPrice || players[5].currentPrice) * 1.08,
      timestamp: now - 2 * oneDayMs
    },
    {
      id: `tx-${Date.now()}-7`,
      userId,
      playerId: tatum?.id || players[6].id,
      playerName: tatum?.name || players[6].name,
      type: 'BUY',
      shares: 22,
      price: (tatum?.currentPrice || players[6].currentPrice) * 0.90,
      total: 22 * (tatum?.currentPrice || players[6].currentPrice) * 0.90,
      timestamp: now - 1 * oneDayMs
    }
  ];

  portfolios.set(userId, portfolio);
  allTransactions.push(...portfolio.transactions);

  res.json({
    success: true,
    message: 'Demo portfolio seeded successfully',
    portfolio: {
      userId: portfolio.userId,
      cash: portfolio.cash,
      holdings: portfolio.holdings,
      totalValue: portfolio.totalValue,
      transactionCount: portfolio.transactions.length
    }
  });
});

*/

console.log('Copy the endpoint code above into your indexHybrid.ts file');
console.log('Then restart the server and call: POST http://localhost:3001/api/seed-demo');
console.log('Body: { "userId": "your-user-id" }');
