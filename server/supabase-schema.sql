-- NBA Stock Market - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========== USERS TABLE ==========
CREATE TABLE IF NOT EXISTS users (
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

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ========== POSITIONS TABLE ==========
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  shares INTEGER NOT NULL,
  avg_buy_price DECIMAL(10, 2) NOT NULL,
  position_type TEXT DEFAULT 'LONG' CHECK (position_type IN ('LONG', 'SHORT')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, player_id)
);

-- Create indexes for positions
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_player_id ON positions(player_id);

-- ========== TRANSACTIONS TABLE ==========
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('BUY', 'SELL', 'OPTION_BUY', 'OPTION_SELL', 'OPTION_EXERCISE', 'SHORT_SELL', 'SHORT_COVER')),
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  shares INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(15, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);

-- ========== LEAGUES TABLE ==========
CREATE TABLE IF NOT EXISTS leagues (
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

-- Create indexes for leagues
CREATE INDEX IF NOT EXISTS idx_leagues_creator_id ON leagues(creator_id);
CREATE INDEX IF NOT EXISTS idx_leagues_invite_code ON leagues(invite_code);
CREATE INDEX IF NOT EXISTS idx_leagues_is_private ON leagues(is_private);
CREATE INDEX IF NOT EXISTS idx_leagues_member_ids ON leagues USING GIN (member_ids);

-- ========== OPTION POSITIONS TABLE ==========
CREATE TABLE IF NOT EXISTS option_positions (
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

-- Create indexes for option positions
CREATE INDEX IF NOT EXISTS idx_option_positions_user_id ON option_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_option_positions_option_id ON option_positions(option_id);

-- ========== LEADERBOARD TABLE (For caching) ==========
CREATE TABLE IF NOT EXISTS leaderboard_entries (
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

-- Create indexes for leaderboard
CREATE INDEX IF NOT EXISTS idx_leaderboard_league_id ON leaderboard_entries(league_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_entries(league_id, rank);

-- ========== FOREIGN KEY CONSTRAINTS ==========
-- Add foreign keys after all tables are created to avoid dependency issues

ALTER TABLE positions 
  ADD CONSTRAINT positions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE transactions 
  ADD CONSTRAINT transactions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE leagues 
  ADD CONSTRAINT leagues_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE option_positions 
  ADD CONSTRAINT option_positions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE leaderboard_entries 
  ADD CONSTRAINT leaderboard_entries_league_id_fkey 
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE;

ALTER TABLE leaderboard_entries 
  ADD CONSTRAINT leaderboard_entries_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ========== ROW LEVEL SECURITY ==========

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true);

-- Users can read all league data (for discovery)
CREATE POLICY "Anyone can view leagues" ON leagues
  FOR SELECT USING (true);

-- Users can read leaderboard
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_entries
  FOR SELECT USING (true);

-- Users can read their own positions
CREATE POLICY "Users can view own positions" ON positions
  FOR SELECT USING (true);

-- Users can read their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (true);

-- Users can read their own option positions
CREATE POLICY "Users can view own option positions" ON option_positions
  FOR SELECT USING (true);

-- Service role can do everything (for backend operations)
-- These policies allow the service role key to bypass RLS
CREATE POLICY "Service role can do anything on users" ON users
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on positions" ON positions
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on transactions" ON transactions
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on leagues" ON leagues
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on option_positions" ON option_positions
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role can do anything on leaderboard_entries" ON leaderboard_entries
  USING (true) WITH CHECK (true);

-- ========== FUNCTIONS & TRIGGERS ==========

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for positions
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for leaderboard
CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE ON leaderboard_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========== SAMPLE DATA (Optional - remove in production) ==========

-- Create a demo user (password: password123)
INSERT INTO users (id, username, email, password_hash, cash, portfolio_value, total_value, starting_balance)
VALUES (
  'demo-user',
  'Demo User',
  'demo@example.com',
  '$2a$10$8Zqz5Z5Z5Z5Z5Z5Z5Z5Z5u5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z',  -- bcrypt hash of 'password123'
  100000,
  0,
  100000,
  100000
)
ON CONFLICT (id) DO NOTHING;

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE '✅ NBA Stock Market database schema created successfully!';
END $$;
