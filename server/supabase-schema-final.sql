-- NBA Stock Market - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar TEXT,
  cash DECIMAL(12, 2) DEFAULT 10000.00,
  starting_balance DECIMAL(12, 2) DEFAULT 10000.00,
  league_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  shares INTEGER NOT NULL,
  avg_buy_price DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'LONG' CHECK (type IN ('LONG', 'SHORT')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, player_id, type)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL', 'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE')),
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  shares INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Option positions table
CREATE TABLE IF NOT EXISTS option_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
  strike_price DECIMAL(10, 2) NOT NULL,
  expiration_date TIMESTAMPTZ NOT NULL,
  contracts INTEGER NOT NULL,
  premium_paid DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_ids TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  starting_balance DECIMAL(12, 2) DEFAULT 10000.00,
  is_active BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT TRUE,
  invite_code TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- League memberships (for easier queries)
CREATE TABLE IF NOT EXISTS league_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_option_positions_user_id ON option_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_creator_id ON leagues(creator_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_user_id ON league_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_league_id ON league_memberships(league_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (true);  -- Allow all users to read (for leaderboards, etc.)

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);

-- RLS Policies for positions table
CREATE POLICY "Users can read their own positions" ON positions
  FOR SELECT USING (true);  -- Allow reading for portfolio display

CREATE POLICY "Users can insert their own positions" ON positions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own positions" ON positions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own positions" ON positions
  FOR DELETE USING (true);

-- RLS Policies for transactions table
CREATE POLICY "Users can read their own transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for option_positions table
CREATE POLICY "Users can read their own option positions" ON option_positions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own option positions" ON option_positions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own option positions" ON option_positions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own option positions" ON option_positions
  FOR DELETE USING (true);

-- RLS Policies for leagues table
CREATE POLICY "Anyone can read leagues" ON leagues
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create leagues" ON leagues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can update their leagues" ON leagues
  FOR UPDATE USING (true);

CREATE POLICY "Creators can delete their leagues" ON leagues
  FOR DELETE USING (true);

-- RLS Policies for league_memberships table
CREATE POLICY "Anyone can read league memberships" ON league_memberships
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join leagues" ON league_memberships
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can leave leagues" ON league_memberships
  FOR DELETE USING (true);
