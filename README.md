# StatStocks

NBA player trading platform with real-time prices and portfolio tracking.

## What it does

Trade NBA players like stocks. Prices update based on performance and market activity. Built this to learn more about WebSockets and real-time data systems.

## Features

- Live price updates via WebSocket
- Buy/sell player shares
- Portfolio tracking with P&L
- Options trading (calls/puts with Black-Scholes pricing)
- Order book with limit orders
- Short selling
- Performance analytics

## Quick Start

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## How it works

The backend runs a price engine that updates player values every few seconds based on stats and market dynamics. WebSocket broadcasts these updates to all connected clients in real-time.

Users get $100k virtual cash to start trading. The order book matches buy/sell orders, and you can also trade options or short stocks.

## Tech Stack

- React + TypeScript + Vite
- Node.js + Express + WebSocket
- Recharts for visualizations
- Lightweight Charts for candlesticks

## Current Status

This is a work in progress. Still working on:
- Better mobile UI
- Database persistence (currently in-memory)
- More advanced analytics
- League/multiplayer features

## Running in production

The easiest way is:
- Frontend: Deploy to Vercel
- Backend: Deploy to Railway or Render

Just make sure to set the WebSocket URL environment variable (`VITE_WS_URL`) on the frontend to point to your backend.

## Notes

Built as a learning project for financial systems and real-time architecture. The Black-Scholes implementation for options pricing was fun to figure out.

Feel free to use this for whatever. MIT license.
