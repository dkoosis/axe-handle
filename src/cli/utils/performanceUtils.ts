/**
 * @file ${filename}
 * @description ${description}
 * @author ${author}
 * @created ${created}
 * @copyright ${copyright}
 * @license ${license}
 */

// Import Node.js performance API
import { performance as nodePerformance } from 'perf_hooks';

/**
 * Performance measurement utilities
 */
class Performance {
  private timers: Record<string, number> = {};
  private static instance: Performance;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): Performance {
    if (!this.instance) {
      this.instance = new Performance();
    }
    return this.instance;
  }

  /**
   * Start a timer
   * @param name Timer name
   */
  public start(name: string): void {
    this.timers[name] = nodePerformance.now();
  }

  /**
   * End a timer and get elapsed time
   * @param name Timer name
   * @returns Elapsed time in milliseconds
   */
  public end(name: string): number {
    const start = this.timers[name];
    if (!start) {
      console.warn(`No timer found with name: ${name}`);
      return 0;
    }

    const elapsed = nodePerformance.now() - start;
    delete this.timers[name];

    console.log(`[Performance] ${name}: ${elapsed.toFixed(2)}ms`);
    return elapsed;
  }
}

/**
 * Global performance instance
 */
export const performance = Performance.getInstance();
