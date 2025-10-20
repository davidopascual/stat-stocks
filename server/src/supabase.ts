import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found in environment variables');
  console.warn('Please add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file');
} else {
  console.log('✅ Supabase configuration loaded');
  console.log('   URL:', supabaseUrl);
}

// Create Supabase client with additional options for better error handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  global: {
    headers: {
      'x-application-name': 'nba-stock-market'
    }
  }
});

// Database helper functions
export const db = {
  // ========== USER OPERATIONS ==========
  
  async createUser(id: string, username: string, email: string, passwordHash: string, startingBalance: number) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id,
        username,
        email,
        password_hash: passwordHash,
        cash: startingBalance,
        portfolio_value: 0,
        total_value: startingBalance,
        percentage_return: 0,
        starting_balance: startingBalance
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateUserLastLogin(userId: string) {
    const { error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
  },

  async updateUserBalance(userId: string, cash: number, portfolioValue: number, totalValue: number) {
    const { error } = await supabase
      .from('users')
      .update({ 
        cash, 
        portfolio_value: portfolioValue, 
        total_value: totalValue,
        percentage_return: ((totalValue - (await this.getUserById(userId))?.starting_balance) / (await this.getUserById(userId))?.starting_balance) * 100
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  // ========== PORTFOLIO/POSITIONS OPERATIONS ==========

  async getPortfolio(userId: string) {
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId);
    
    const { data: options, error: optError } = await supabase
      .from('option_positions')
      .select('*')
      .eq('user_id', userId);
    
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (posError || optError || txError) {
      throw posError || optError || txError;
    }

    return {
      positions: positions || [],
      optionPositions: options || [],
      transactions: transactions || []
    };
  },

  async addPosition(userId: string, playerId: string, playerName: string, shares: number, avgBuyPrice: number, positionType: 'LONG' | 'SHORT') {
    const { data, error } = await supabase
      .from('positions')
      .insert({
        user_id: userId,
        player_id: playerId,
        player_name: playerName,
        shares,
        avg_buy_price: avgBuyPrice,
        position_type: positionType
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePosition(userId: string, playerId: string, shares: number, avgBuyPrice: number) {
    if (shares <= 0) {
      // Remove position if shares are 0 or negative
      return await this.removePosition(userId, playerId);
    }

    const { data, error} = await supabase
      .from('positions')
      .update({ shares, avg_buy_price: avgBuyPrice })
      .eq('user_id', userId)
      .eq('player_id', playerId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async removePosition(userId: string, playerId: string) {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('user_id', userId)
      .eq('player_id', playerId);
    
    if (error) throw error;
  },

  async getPosition(userId: string, playerId: string) {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('player_id', playerId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // ========== TRANSACTION OPERATIONS ==========

  async addTransaction(userId: string, type: string, playerId: string, playerName: string, shares: number, price: number) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        player_id: playerId,
        player_name: playerName,
        shares,
        price,
        total: shares * price
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ========== LEAGUE OPERATIONS ==========

  async createLeague(league: any) {
    const { data, error } = await supabase
      .from('leagues')
      .insert({
        id: league.id,
        name: league.name,
        description: league.description,
        creator_id: league.creatorId,
        member_ids: league.memberIds,
        start_date: league.startDate,
        end_date: league.endDate,
        starting_balance: league.startingBalance,
        is_active: league.isActive,
        is_private: league.isPrivate,
        invite_code: league.inviteCode,
        settings: league.settings
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getLeague(leagueId: string) {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getLeagueByInviteCode(inviteCode: string) {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateLeague(leagueId: string, updates: any) {
    const { data, error } = await supabase
      .from('leagues')
      .update(updates)
      .eq('id', leagueId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserLeagues(userId: string) {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .contains('member_ids', [userId]);
    
    if (error) throw error;
    return data || [];
  },

  async getPublicLeagues() {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('is_private', false)
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  },

  // ========== OPTION POSITIONS ==========

  async addOptionPosition(optionPosition: any) {
    const { data, error } = await supabase
      .from('option_positions')
      .insert(optionPosition)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getOptionPositions(userId: string) {
    const { data, error } = await supabase
      .from('option_positions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  },

  async removeOptionPosition(positionId: string) {
    const { error } = await supabase
      .from('option_positions')
      .delete()
      .eq('id', positionId);
    
    if (error) throw error;
  }
};

// Export both for compatibility
export const dbHelpers = db;
