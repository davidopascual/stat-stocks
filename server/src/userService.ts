import { supabase } from './supabase.js';
import { User, Position, Transaction } from './types.js';

class UserService {
  // Get user from Supabase
  async getUser(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          positions (*),
          transactions (*),
          option_positions (*)
        `)
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching user:', error);
        return null;
      }

      // Transform database format to app format
      return this.transformDbUserToAppUser(data);
    } catch (error) {
      console.error('Error in getUser:', error);
      return null;
    }
  }

  // Update user's cash balance
  async updateUserCash(userId: string, newCash: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ cash: newCash })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user cash:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserCash:', error);
      return false;
    }
  }

  // Add or update a position
  async upsertPosition(userId: string, position: {
    player_id: string;
    player_name: string;
    shares: number;
    avg_buy_price: number;
    type?: 'LONG' | 'SHORT';
  }): Promise<boolean> {
    try {
      // Check if position exists
      const { data: existing } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId)
        .eq('player_id', position.player_id)
        .eq('type', position.type || 'LONG')
        .single();

      if (existing) {
        // Update existing position
        const { error } = await supabase
          .from('positions')
          .update({
            shares: position.shares,
            avg_buy_price: position.avg_buy_price
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating position:', error);
          return false;
        }
      } else {
        // Create new position
        const { error } = await supabase
          .from('positions')
          .insert({
            user_id: userId,
            player_id: position.player_id,
            player_name: position.player_name,
            shares: position.shares,
            avg_buy_price: position.avg_buy_price,
            type: position.type || 'LONG'
          });

        if (error) {
          console.error('Error creating position:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in upsertPosition:', error);
      return false;
    }
  }

  // Delete a position
  async deletePosition(userId: string, playerId: string, type: 'LONG' | 'SHORT' = 'LONG'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('user_id', userId)
        .eq('player_id', playerId)
        .eq('type', type);

      if (error) {
        console.error('Error deleting position:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePosition:', error);
      return false;
    }
  }

  // Add a transaction
  async addTransaction(userId: string, transaction: {
    type: 'BUY' | 'SELL' | 'OPTION_BUY' | 'OPTION_SELL' | 'OPTION_EXERCISE';
    player_id: string;
    player_name: string;
    shares: number;
    price: number;
    total: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          ...transaction
        });

      if (error) {
        console.error('Error adding transaction:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addTransaction:', error);
      return false;
    }
  }

  // Get user's positions
  async getUserPositions(userId: string): Promise<Position[]> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', userId);

      if (error || !data) {
        console.error('Error fetching positions:', error);
        return [];
      }

      return data.map((p: any) => ({
        userId: p.user_id,
        playerId: p.player_id,
        playerName: p.player_name,
        shares: p.shares,
        avgBuyPrice: p.avg_buy_price,
        currentPrice: 0, // Will be updated with current market price
        type: p.type as 'LONG' | 'SHORT'
      }));
    } catch (error) {
      console.error('Error in getUserPositions:', error);
      return [];
    }
  }

  // Get user's transactions
  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      return data.map((t: any) => ({
        id: t.id,
        type: t.type,
        playerId: t.player_id,
        playerName: t.player_name,
        shares: t.shares,
        price: t.price,
        total: t.total,
        timestamp: new Date(t.created_at)
      }));
    } catch (error) {
      console.error('Error in getUserTransactions:', error);
      return [];
    }
  }

  // Transform database user to app user format
  private transformDbUserToAppUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      cash: dbUser.cash || 10000,
      portfolioValue: 0, // Calculated on the fly
      totalValue: dbUser.cash || 10000,
      percentageReturn: 0,
      startingBalance: dbUser.starting_balance || 10000,
      createdAt: new Date(dbUser.created_at),
      leagueIds: dbUser.league_ids || [],
      positions: (dbUser.positions || []).map((p: any) => ({
        userId: p.user_id,
        playerId: p.player_id,
        playerName: p.player_name,
        shares: p.shares,
        avgBuyPrice: p.avg_buy_price,
        currentPrice: 0,
        type: p.type as 'LONG' | 'SHORT'
      })),
      transactions: (dbUser.transactions || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        playerId: t.player_id,
        playerName: t.player_name,
        shares: t.shares,
        price: t.price,
        total: t.total,
        timestamp: new Date(t.created_at)
      })),
      optionPositions: (dbUser.option_positions || []).map((op: any) => ({
        userId: op.user_id,
        optionId: op.option_id,
        playerId: op.player_id,
        playerName: op.player_name,
        optionType: op.option_type,
        strikePrice: op.strike_price,
        expirationDate: new Date(op.expiration_date),
        contracts: op.contracts,
        premiumPaid: op.premium_paid
      }))
    };
  }
}

export const userService = new UserService();
