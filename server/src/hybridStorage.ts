import { getInMemoryUsers, isUsingSupabase } from './auth.js';
import { supabase } from './supabase.js';
import { User, Position, Transaction } from './types.js';

class HybridStorageService {
  // In-memory storage for when Supabase isn't available
  private positions: Map<string, Position[]> = new Map();
  private transactions: Map<string, Transaction[]> = new Map();

  // Get user from either Supabase or in-memory
  async getUser(userId: string): Promise<any | null> {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          // Also fetch positions and transactions
          const positions = await this.getUserPositions(userId);
          const transactions = await this.getUserTransactions(userId);
          
          return {
            ...data,
            cash: data.cash || 10000,
            positions,
            transactions
          };
        }
      } catch (err) {
        console.error('Supabase query failed:', err);
      }
    }

    // Fall back to in-memory
    const users = getInMemoryUsers();
    const user = users.get(userId);
    if (user) {
      return {
        ...user,
        positions: this.positions.get(userId) || [],
        transactions: this.transactions.get(userId) || []
      };
    }

    return null;
  }

  // Update user's cash balance
  async updateUserCash(userId: string, newCash: number): Promise<boolean> {
    if (isUsingSupabase()) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ cash: newCash })
          .eq('id', userId);

        if (!error) return true;
      } catch (err) {
        console.error('Failed to update cash in Supabase:', err);
      }
    }

    // Fall back to in-memory
    const users = getInMemoryUsers();
    const user = users.get(userId);
    if (user) {
      user.cash = newCash;
      return true;
    }

    return false;
  }

  // Add or update a position
  async upsertPosition(userId: string, position: {
    player_id: string;
    player_name: string;
    shares: number;
    avg_buy_price: number;
    type?: 'LONG' | 'SHORT';
  }): Promise<boolean> {
    if (isUsingSupabase()) {
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

          if (!error) return true;
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

          if (!error) return true;
        }
      } catch (err) {
        console.error('Failed to upsert position in Supabase:', err);
      }
    }

    // Fall back to in-memory
    let userPositions = this.positions.get(userId) || [];
    const existingIndex = userPositions.findIndex(
      p => p.playerId === position.player_id && p.type === (position.type || 'LONG')
    );

    const newPosition: Position = {
      userId,
      playerId: position.player_id,
      playerName: position.player_name,
      shares: position.shares,
      avgBuyPrice: position.avg_buy_price,
      currentPrice: 0,
      type: position.type || 'LONG'
    };

    if (existingIndex >= 0) {
      userPositions[existingIndex] = newPosition;
    } else {
      userPositions.push(newPosition);
    }

    this.positions.set(userId, userPositions);
    return true;
  }

  // Delete a position
  async deletePosition(userId: string, playerId: string, type: 'LONG' | 'SHORT' = 'LONG'): Promise<boolean> {
    if (isUsingSupabase()) {
      try {
        const { error } = await supabase
          .from('positions')
          .delete()
          .eq('user_id', userId)
          .eq('player_id', playerId)
          .eq('type', type);

        if (!error) return true;
      } catch (err) {
        console.error('Failed to delete position in Supabase:', err);
      }
    }

    // Fall back to in-memory
    let userPositions = this.positions.get(userId) || [];
    userPositions = userPositions.filter(p => !(p.playerId === playerId && p.type === type));
    this.positions.set(userId, userPositions);
    return true;
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
    if (isUsingSupabase()) {
      try {
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            ...transaction
          });

        if (!error) return true;
      } catch (err) {
        console.error('Failed to add transaction in Supabase:', err);
      }
    }

    // Fall back to in-memory
    const userTransactions = this.transactions.get(userId) || [];
    const newTransaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random()}`,
      userId,
      username: '',
      type: transaction.type,
      playerId: transaction.player_id,
      playerName: transaction.player_name,
      shares: transaction.shares,
      price: transaction.price,
      total: transaction.total,
      timestamp: new Date(),
      fee: 0
    };

    userTransactions.unshift(newTransaction);
    this.transactions.set(userId, userTransactions);
    return true;
  }

  // Get user's positions
  async getUserPositions(userId: string): Promise<Position[]> {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          return data.map((p: any) => ({
            userId: p.user_id,
            playerId: p.player_id,
            playerName: p.player_name,
            shares: p.shares,
            avgBuyPrice: p.avg_buy_price,
            currentPrice: 0,
            type: p.type as 'LONG' | 'SHORT'
          }));
        }
      } catch (err) {
        console.error('Failed to get positions from Supabase:', err);
      }
    }

    // Fall back to in-memory
    return this.positions.get(userId) || [];
  }

  // Get user's transactions
  async getUserTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    if (isUsingSupabase()) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map((t: any) => ({
            id: t.id,
            userId: t.user_id,
            username: '',
            type: t.type,
            playerId: t.player_id,
            playerName: t.player_name,
            shares: t.shares,
            price: t.price,
            total: t.total,
            timestamp: new Date(t.created_at),
            fee: 0
          }));
        }
      } catch (err) {
        console.error('Failed to get transactions from Supabase:', err);
      }
    }

    // Fall back to in-memory
    const transactions = this.transactions.get(userId) || [];
    return transactions.slice(0, limit);
  }
}

export const hybridStorage = new HybridStorageService();
