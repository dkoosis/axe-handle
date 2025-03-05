// src/utils/performanceUtils.ts
import { logger, LogCategory } from './logger';

/**
 * Performance tracking information
 */
interface PerformanceEntry {
  /** Start time in milliseconds */
  startTime: number;
  /** End time in milliseconds (if completed) */
  endTime?: number;
  /** Duration in milliseconds (if completed) */
  duration?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Performance summary
 */
interface PerformanceSummary {
  /** Overall time spent */
  totalTime: number;
  /** Time spent per operation */
  operations: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  }>;
}

/**
 * Performance tracking utilities
 */
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private enabled: boolean = false;
  private markers: Map<string, PerformanceEntry> = new Map();
  private completed: Map<string, PerformanceEntry[]> = new Map();
  private startTime: number = 0;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }
  
  /**
   * Enable or disable performance tracking
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    if (enabled && this.startTime === 0) {
      this.startTime = Date.now();
    }
  }
  
  /**
   * Start tracking an operation
   */
  public start(key: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;
    
    this.markers.set(key, {
      startTime: Date.now(),
      metadata
    });
  }
  
  /**
   * End tracking an operation
   */
  public end(key: string, additionalMetadata?: Record<string, any>): void {
    if (!this.enabled) return;
    
    const marker = this.markers.get(key);
    if (!marker) {
      logger.warn(`No start marker found for: ${key}`, LogCategory.GENERAL);
      return;
    }
    
    const endTime = Date.now();
    const duration = endTime - marker.startTime;
    
    const entry: PerformanceEntry = {
      ...marker,
      endTime,
      duration,
metadata: {
    ...marker.metadata,
    ...additionalMetadata
  }
};

// Add to completed operations
if (!this.completed.has(key)) {
  this.completed.set(key, []);
}
this.completed.get(key)!.push(entry);

// Remove from active markers
this.markers.delete(key);

// Log if duration exceeds threshold (100ms)
if (duration > 100) {
  logger.debug(`Performance: ${key} took ${duration}ms`, LogCategory.GENERAL);
}
}

/**
* Track an operation with an async function
*/
public async track<T>(key: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
if (!this.enabled) {
  return fn();
}

this.start(key, metadata);
try {
  const result = await fn();
  this.end(key);
  return result;
} catch (error) {
  this.end(key, { error: error instanceof Error ? error.message : String(error) });
  throw error;
}
}

/**
* Track an operation with a sync function
*/
public trackSync<T>(key: string, fn: () => T, metadata?: Record<string, any>): T {
if (!this.enabled) {
  return fn();
}

this.start(key, metadata);
try {
  const result = fn();
  this.end(key);
  return result;
} catch (error) {
  this.end(key, { error: error instanceof Error ? error.message : String(error) });
  throw error;
}
}

/**
* Get performance summary
*/
public getSummary(): PerformanceSummary {
const totalTime = this.startTime > 0 ? Date.now() - this.startTime : 0;
const operations: Record<string, {
  count: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}> = {};

// Calculate statistics for each operation
for (const [key, entries] of this.completed.entries()) {
  let totalOpTime = 0;
  let minTime = Number.MAX_SAFE_INTEGER;
  let maxTime = 0;
  
  for (const entry of entries) {
    if (entry.duration !== undefined) {
      totalOpTime += entry.duration;
      minTime = Math.min(minTime, entry.duration);
      maxTime = Math.max(maxTime, entry.duration);
    }
  }
  
  operations[key] = {
    count: entries.length,
    totalTime: totalOpTime,
    averageTime: entries.length > 0 ? totalOpTime / entries.length : 0,
    minTime: minTime === Number.MAX_SAFE_INTEGER ? 0 : minTime,
    maxTime
  };
}

return {
  totalTime,
  operations
};
}

/**
* Log performance summary
*/
public logSummary(): void {
if (!this.enabled) return;

const summary = this.getSummary();

logger.section('Performance Summary');
logger.info(`Total execution time: ${summary.totalTime}ms`, LogCategory.GENERAL);

const operationEntries = Object.entries(summary.operations)
  .sort((a, b) => b[1].totalTime - a[1].totalTime);

if (operationEntries.length > 0) {
  logger.info('Operations by total time:', LogCategory.GENERAL);
  for (const [key, stats] of operationEntries) {
    logger.info(
      `${key}: ${stats.count} calls, ${stats.totalTime}ms total, ${stats.averageTime.toFixed(2)}ms avg`,
      LogCategory.GENERAL
    );
  }
} else {
  logger.info('No operations recorded', LogCategory.GENERAL);
}
}

/**
* Reset performance tracking
*/
public reset(): void {
this.markers.clear();
this.completed.clear();
this.startTime = this.enabled ? Date.now() : 0;
}
}

// Export singleton instance
export const performance = PerformanceTracker.getInstance();