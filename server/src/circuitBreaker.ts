import { CircuitBreaker, Player } from './types.js';
import { EventEmitter } from 'events';

class CircuitBreakerSystem extends EventEmitter {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private priceHistory: Map<string, number[]> = new Map(); // Last N prices
  private readonly VOLATILITY_THRESHOLD = 0.15; // 15% move triggers halt
  private readonly HALT_DURATION = 5 * 60 * 1000; // 5 minutes

  checkAndTrigger(player: Player, previousPrice: number): boolean {
    const priceChange = Math.abs((player.currentPrice - previousPrice) / previousPrice);

    // Check if already halted
    const existingBreaker = this.breakers.get(player.id);
    if (existingBreaker && existingBreaker.triggered) {
      const now = new Date();
      if (now < existingBreaker.resumesAt) {
        return true; // Still halted
      } else {
        // Resume trading
        this.resumeTrading(player.id);
        return false;
      }
    }

    // Check for circuit breaker trigger
    if (priceChange >= this.VOLATILITY_THRESHOLD) {
      this.triggerBreaker(player, 'VOLATILITY', previousPrice);
      return true;
    }

    return false;
  }

  private triggerBreaker(player: Player, reason: 'VOLATILITY' | 'VOLUME' | 'NEWS', priceAtHalt: number): void {
    const now = new Date();
    const resumesAt = new Date(now.getTime() + this.HALT_DURATION);

    const breaker: CircuitBreaker = {
      playerId: player.id,
      triggered: true,
      reason,
      haltedAt: now,
      resumesAt,
      priceAtHalt
    };

    this.breakers.set(player.id, breaker);

    console.log(`⚠️  CIRCUIT BREAKER: Trading halted for ${player.name} - ${reason}`);
    console.log(`   Price at halt: $${priceAtHalt.toFixed(2)}`);
    console.log(`   Resumes at: ${resumesAt.toLocaleTimeString()}`);

    this.emit('halted', breaker);
  }

  private resumeTrading(playerId: string): void {
    const breaker = this.breakers.get(playerId);
    if (breaker) {
      breaker.triggered = false;
      console.log(`✅ Trading resumed for player ${playerId}`);
      this.emit('resumed', breaker);
    }
  }

  isHalted(playerId: string): boolean {
    const breaker = this.breakers.get(playerId);
    if (!breaker || !breaker.triggered) return false;

    const now = new Date();
    if (now >= breaker.resumesAt) {
      this.resumeTrading(playerId);
      return false;
    }

    return true;
  }

  getBreaker(playerId: string): CircuitBreaker | undefined {
    return this.breakers.get(playerId);
  }

  getAllActiveBreakers(): CircuitBreaker[] {
    return Array.from(this.breakers.values()).filter(b => b.triggered);
  }

  // Manual trigger (for news events, etc.)
  manualTrigger(player: Player, reason: 'NEWS' | 'VOLUME'): void {
    this.triggerBreaker(player, reason, player.currentPrice);
  }
}

export const circuitBreakerSystem = new CircuitBreakerSystem();
