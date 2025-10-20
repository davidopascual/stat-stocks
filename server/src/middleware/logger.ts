import { Request, Response, NextFunction } from 'express';

/**
 * PROFESSIONAL REQUEST LOGGING MIDDLEWARE
 *
 * Production-ready logging with:
 * - Request/response timing
 * - Status code tracking
 * - Error logging
 * - Performance metrics
 */

interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  // Color codes for console output
  private readonly colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
  };

  private getStatusColor(statusCode: number): string {
    if (statusCode >= 500) return this.colors.red;
    if (statusCode >= 400) return this.colors.yellow;
    if (statusCode >= 300) return this.colors.blue;
    if (statusCode >= 200) return this.colors.green;
    return this.colors.reset;
  }

  private getMethodColor(method: string): string {
    switch (method) {
      case 'GET': return this.colors.green;
      case 'POST': return this.colors.blue;
      case 'PUT': return this.colors.yellow;
      case 'DELETE': return this.colors.red;
      default: return this.colors.reset;
    }
  }

  log(entry: LogEntry) {
    // Add to logs array
    this.logs.push(entry);

    // Keep only last MAX_LOGS entries
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    // Console output with colors
    const statusColor = this.getStatusColor(entry.statusCode);
    const methodColor = this.getMethodColor(entry.method);
    const durationColor = entry.duration > 1000 ? this.colors.red :
                          entry.duration > 500 ? this.colors.yellow :
                          this.colors.gray;

    console.log(
      `${this.colors.gray}[${entry.timestamp}]${this.colors.reset} ` +
      `${methodColor}${entry.method}${this.colors.reset} ` +
      `${entry.url} ` +
      `${statusColor}${entry.statusCode}${this.colors.reset} ` +
      `${durationColor}${entry.duration}ms${this.colors.reset}`
    );
  }

  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  getStatistics() {
    if (this.logs.length === 0) {
      return {
        totalRequests: 0,
        avgDuration: 0,
        statusCodes: {},
        methods: {}
      };
    }

    const stats = {
      totalRequests: this.logs.length,
      avgDuration: 0,
      statusCodes: {} as Record<number, number>,
      methods: {} as Record<string, number>,
      errors: 0,
      slowRequests: 0
    };

    let totalDuration = 0;

    this.logs.forEach(log => {
      // Duration
      totalDuration += log.duration;

      // Status codes
      stats.statusCodes[log.statusCode] = (stats.statusCodes[log.statusCode] || 0) + 1;

      // Methods
      stats.methods[log.method] = (stats.methods[log.method] || 0) + 1;

      // Errors
      if (log.statusCode >= 400) {
        stats.errors++;
      }

      // Slow requests (> 1s)
      if (log.duration > 1000) {
        stats.slowRequests++;
      }
    });

    stats.avgDuration = Math.round(totalDuration / this.logs.length);

    return stats;
  }
}

// Singleton logger instance
export const logger = new Logger();

// Express middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Capture original res.send to log after response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    res.send = originalSend; // Restore original method
    const duration = Date.now() - startTime;

    logger.log({
      timestamp,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip || req.socket.remoteAddress
    });

    return originalSend.call(this, data);
  };

  next();
};

// WebSocket logging helper
export const logWebSocket = (event: string, details?: any) => {
  console.log(
    `${logger['colors'].blue}[WS]${logger['colors'].reset} ` +
    `${event} ` +
    `${details ? JSON.stringify(details) : ''}`
  );
};

// Performance logging for slow operations
export const logPerformance = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  const color = duration > 100 ? logger['colors'].red :
                duration > 50 ? logger['colors'].yellow :
                logger['colors'].gray;

  console.log(
    `${logger['colors'].gray}[PERF]${logger['colors'].reset} ` +
    `${operation}: ${color}${duration}ms${logger['colors'].reset}`
  );
};
