-- NBA Stock Market - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- This will DROP existing tables and recreate them fresh

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS leaderboard_entries CASCADE;
DROP TABLE IF EXISTS option_positions CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS leagues CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========== USERS TABLE ==========
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  cash DECIMAL(15, 2) DEFAULT 100000,
  portfolio_value DECIMAL(15, 2) DEFAULT 0,
  total_value DECIMAL(15, 2) DEFAULT 100000,
  percentage_return DECIMAL(10, 2) DEFAULT 0,
  starting_balance DECIMAL(15, 2) DEFAULT 100000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  league_ids TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ========== POSITIONS TABLE ==========
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  shares INTEGER NOT NULL,
  avg_buy_price DECIMAL(10, 2) NOT NULL,
  position_type TEXT DEFAULT 'LONG' CHECK (position_type IN ('LONG', 'SHORT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);

CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_positions_player_id ON positions(player_id);

-- ========== TRANSACTIONS TABLE ==========
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL', 'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE', 'SHORT_SELL', 'SHORT_COVER')),
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  shares INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ========== LEAGUES TABLE ==========
CREATE TABLE leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_ids TEXT[] DEFAULT '{}',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  starting_balance DECIMAL(15, 2) DEFAULT 100000,
  is_active BOOLEAN DEFAULT TRUE,
  is_private BOOLEAN DEFAULT TRUE,
  invite_code TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leagues_creator_id ON leagues(creator_id);
CREATE INDEX idx_leagues_invite_code ON leagues(invite_code);
CREATE INDEX idx_leagues_is_private ON leagues(is_private);
CREATE INDEX idx_leagues_member_ids ON leagues USING GIN (member_ids);

-- ========== OPTION POSITIONS TABLE ==========
CREATE TABLE option_positions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  contracts INTEGER NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position TEXT DEFAULT 'LONG' CHECK (position IN ('LONG', 'SHORT')),
  player_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_option_positions_user_id ON option_positions(user_id);
CREATE INDEX idx_option_positions_option_id ON option_positions(option_id);

-- ========== LEADERBOARD TABLE ==========
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_value DECIMAL(15, 2) NOT NULL,
  percentage_return DECIMAL(10, 2) NOT NULL,
  day_return DECIMAL(10, 2) DEFAULT 0,
  week_return DECIMAL(10, 2) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 4) DEFAULT 0,
  sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
  max_drawdown DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, user_id)
);

CREATE INDEX idx_leaderboard_league_id ON leaderboard_entries(league_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(league_id, rank);

-- ========== ROW LEVEL SECURITY ==========
-- Disable RLS for development (enable for production with proper policies)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE leagues DISABLE ROW LEVEL SECURITY;
ALTER TABLE option_positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries DISABLE ROW LEVEL SECURITY;

-- ========== FUNCTIONS & TRIGGERS ==========
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_positions_updated_at 
  BEFORE UPDATE ON positions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboard_updated_at 
  BEFORE UPDATE ON leaderboard_entries
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========== SUCCESS MESSAGE ==========
DO $$
BEGIN
  RAISE NOTICE '✅ NBA Stock Market database schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - users';
  RAISE NOTICE '  - positions';
  RAISE NOTICE '  - transactions';
  RAISE NOTICE '  - leagues';
  RAISE NOTICE '  - option_positions';
  RAISE NOTICE '  - leaderboard_entries';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  RLS is DISABLED for development';
  RAISE NOTICE '   Enable RLS and add policies before production!';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now test your authentication endpoints!';
END $$;
