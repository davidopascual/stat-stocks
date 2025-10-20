import { LimitOrder, OrderBook, Transaction, Player } from './types.js';
import { EventEmitter } from 'events';

class OrderBookManager extends EventEmitter {
  private orderBooks: Map<string, OrderBook> = new Map();
  private orders: Map<string, LimitOrder> = new Map();

  constructor() {
    super();
  }

  initializeOrderBook(player: Player): void {
    if (!this.orderBooks.has(player.id)) {
      this.orderBooks.set(player.id, {
        playerId: player.id,
        playerName: player.name,
        buyOrders: [],
        sellOrders: [],
        lastTrade: player.currentPrice,
        spread: player.askPrice - player.bidPrice,
        depth: { bids: [], asks: [] }
      });
    }
  }

  placeLimitOrder(order: LimitOrder): { success: boolean; message: string; trades?: Transaction[] } {
    this.orders.set(order.id, order);

    // Try to match order immediately
    const matches = this.findMatches(order);

    if (matches.length > 0) {
      const trades = this.executeTrades(order, matches);
      return { success: true, message: 'Order filled', trades };
    }

    // Add to order book if not fully filled
    if (order.filledShares < order.shares) {
      this.addToOrderBook(order);
      return { success: true, message: 'Order placed in book' };
    }

    return { success: true, message: 'Order fully filled' };
  }

  private findMatches(order: LimitOrder): LimitOrder[] {
    const orderBook = this.orderBooks.get(order.playerId);
    if (!orderBook) return [];

    const matches: LimitOrder[] = [];

    if (order.type === 'BUY') {
      // Match with sell orders at or below buy price
      for (const sellOrder of orderBook.sellOrders) {
        if (sellOrder.price <= order.price && sellOrder.status === 'OPEN') {
          matches.push(sellOrder);
        }
      }
    } else {
      // Match with buy orders at or above sell price
      for (const buyOrder of orderBook.buyOrders) {
        if (buyOrder.price >= order.price && buyOrder.status === 'OPEN') {
          matches.push(buyOrder);
        }
      }
    }

    return matches;
  }

  private executeTrades(order: LimitOrder, matches: LimitOrder[]): Transaction[] {
    const trades: Transaction[] = [];
    let remainingShares = order.shares - order.filledShares;

    for (const matchOrder of matches) {
      if (remainingShares <= 0) break;

      const matchRemaining = matchOrder.shares - matchOrder.filledShares;
      const tradedShares = Math.min(remainingShares, matchRemaining);
      const tradePrice = matchOrder.price; // Taker gets maker's price

      // Create transactions for both parties
      const buyerTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random()}`,
        userId: order.type === 'BUY' ? order.userId : matchOrder.userId,
        username: order.type === 'BUY' ? order.username : matchOrder.username,
        type: 'BUY',
        playerId: order.playerId,
        playerName: order.playerName,
        shares: tradedShares,
        price: tradePrice,
        total: tradedShares * tradePrice,
        fee: 0,
        timestamp: new Date(),
        orderId: order.type === 'BUY' ? order.id : matchOrder.id
      };

      const sellerTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random() + 0.1}`,
        userId: order.type === 'SELL' ? order.userId : matchOrder.userId,
        username: order.type === 'SELL' ? order.username : matchOrder.username,
        type: 'SELL',
        playerId: order.playerId,
        playerName: order.playerName,
        shares: tradedShares,
        price: tradePrice,
        total: tradedShares * tradePrice,
        fee: 0,
        timestamp: new Date(),
        orderId: order.type === 'SELL' ? order.id : matchOrder.id
      };

      trades.push(buyerTx, sellerTx);

      // Update order fill status
      order.filledShares += tradedShares;
      matchOrder.filledShares += tradedShares;
      remainingShares -= tradedShares;

      // Update order statuses
      if (order.filledShares >= order.shares) {
        order.status = 'FILLED';
      } else if (order.filledShares > 0) {
        order.status = 'PARTIAL';
      }

      if (matchOrder.filledShares >= matchOrder.shares) {
        matchOrder.status = 'FILLED';
        this.removeFromOrderBook(matchOrder);
      } else if (matchOrder.filledShares > 0) {
        matchOrder.status = 'PARTIAL';
      }

      // Update last trade price
      const orderBook = this.orderBooks.get(order.playerId);
      if (orderBook) {
        orderBook.lastTrade = tradePrice;
      }

      // Emit trade event
      this.emit('trade', { order, matchOrder, trades });
    }

    return trades;
  }

  private addToOrderBook(order: LimitOrder): void {
    const orderBook = this.orderBooks.get(order.playerId);
    if (!orderBook) return;

    if (order.type === 'BUY') {
      orderBook.buyOrders.push(order);
      // Sort by price descending (highest bids first)
      orderBook.buyOrders.sort((a, b) => b.price - a.price);
    } else {
      orderBook.sellOrders.push(order);
      // Sort by price ascending (lowest asks first)
      orderBook.sellOrders.sort((a, b) => a.price - b.price);
    }

    this.updateOrderBookDepth(order.playerId);
    this.emit('orderbook_update', orderBook);
  }

  private removeFromOrderBook(order: LimitOrder): void {
    const orderBook = this.orderBooks.get(order.playerId);
    if (!orderBook) return;

    if (order.type === 'BUY') {
      orderBook.buyOrders = orderBook.buyOrders.filter(o => o.id !== order.id);
    } else {
      orderBook.sellOrders = orderBook.sellOrders.filter(o => o.id !== order.id);
    }

    this.updateOrderBookDepth(order.playerId);
    this.emit('orderbook_update', orderBook);
  }

  private updateOrderBookDepth(playerId: string): void {
    const orderBook = this.orderBooks.get(playerId);
    if (!orderBook) return;

    // Aggregate bid depth
    const bidMap = new Map<number, number>();
    for (const order of orderBook.buyOrders) {
      if (order.status === 'OPEN' || order.status === 'PARTIAL') {
        const remaining = order.shares - order.filledShares;
        bidMap.set(order.price, (bidMap.get(order.price) || 0) + remaining);
      }
    }

    // Aggregate ask depth
    const askMap = new Map<number, number>();
    for (const order of orderBook.sellOrders) {
      if (order.status === 'OPEN' || order.status === 'PARTIAL') {
        const remaining = order.shares - order.filledShares;
        askMap.set(order.price, (askMap.get(order.price) || 0) + remaining);
      }
    }

    orderBook.depth.bids = Array.from(bidMap.entries())
      .map(([price, volume]) => ({ price, volume }))
      .sort((a, b) => b.price - a.price)
      .slice(0, 10); // Top 10 levels

    orderBook.depth.asks = Array.from(askMap.entries())
      .map(([price, volume]) => ({ price, volume }))
      .sort((a, b) => a.price - b.price)
      .slice(0, 10); // Top 10 levels

    orderBook.spread = orderBook.depth.asks[0]?.price - orderBook.depth.bids[0]?.price || 0;
  }

  cancelOrder(orderId: string, userId: string): { success: boolean; message: string } {
    const order = this.orders.get(orderId);

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    if (order.userId !== userId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (order.status === 'FILLED') {
      return { success: false, message: 'Order already filled' };
    }

    order.status = 'CANCELLED';
    this.removeFromOrderBook(order);

    return { success: true, message: 'Order cancelled' };
  }

  getOrderBook(playerId: string): OrderBook | undefined {
    return this.orderBooks.get(playerId);
  }

  getUserOrders(userId: string): LimitOrder[] {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  getOpenOrders(userId: string): LimitOrder[] {
    return Array.from(this.orders.values()).filter(
      order => order.userId === userId && (order.status === 'OPEN' || order.status === 'PARTIAL')
    );
  }

  // Clean up expired orders
  cleanupExpiredOrders(): void {
    const now = new Date();

    for (const [orderId, order] of this.orders.entries()) {
      if (order.expiresAt < now && (order.status === 'OPEN' || order.status === 'PARTIAL')) {
        order.status = 'EXPIRED';
        this.removeFromOrderBook(order);
      }
    }
  }
}

export const orderBookManager = new OrderBookManager();
