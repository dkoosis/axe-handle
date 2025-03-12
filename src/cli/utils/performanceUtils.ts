// Path: src/cli/utils/performanceUtils.ts
/**
 * @file src/cli/utils/performanceUtils.ts
 * @description Performance measurement utilities
 * @author Axe Handle Team
 * @created 2025-03-12
 * @copyright Copyright (c) 2025 Axe Handle Project
 * @license ISC
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
