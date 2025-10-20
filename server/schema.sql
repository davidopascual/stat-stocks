-- NBA Stock Market Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW()
);

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cash DECIMAL(12,2) DEFAULT 100000,
  total_value DECIMAL(12,2) DEFAULT 100000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  shares INT NOT NULL CHECK (shares > 0),
  avg_buy_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(portfolio_id, player_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
  shares INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Option positions table
CREATE TABLE IF NOT EXISTS option_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  option_id VARCHAR(100) NOT NULL,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('CALL', 'PUT')),
  position VARCHAR(10) NOT NULL CHECK (position IN ('LONG', 'SHORT')),
  strike_price DECIMAL(10,2) NOT NULL,
  contracts INT NOT NULL,
  premium DECIMAL(10,2) NOT NULL,
  expiration_date TIMESTAMP NOT NULL,
  purchase_date TIMESTAMP DEFAULT NOW()
);

-- Limit orders table
CREATE TABLE IF NOT EXISTS limit_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  player_id VARCHAR(50) NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('BUY', 'SELL')),
  order_type VARCHAR(10) NOT NULL DEFAULT 'LIMIT',
  price DECIMAL(10,2) NOT NULL,
  shares INT NOT NULL,
  filled_shares INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FILLED', 'PARTIAL', 'CANCELLED', 'EXPIRED')),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id),
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  starting_balance DECIMAL(12,2) DEFAULT 100000,
  is_private BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  start_date TIMESTAMP,
  end_date TIMESTAMP
);

-- League members table
CREATE TABLE IF NOT EXISTS league_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_holdings_portfolio ON holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_user ON limit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_limit_orders_player ON limit_orders(player_id, status);
CREATE INDEX IF NOT EXISTS idx_league_members ON league_members(league_id, user_id);

-- Success message
SELECT 'Database schema created successfully!' AS status;
