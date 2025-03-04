// Path: src/utils/debugUtils.ts
// Provides debugging utilities for the Axe Handle generator.

import * as fs from 'fs';
import * as path from 'path';
import { AxeError } from '../types';

// Enable debug mode based on environment variable
const DEBUG_MODE = process.env.AXE_HANDLE_DEBUG === 'true';

/**
 * Logger for debug information
 */
export class DebugLogger {
  private static instance: DebugLogger;
  private enabled: boolean;
  private logFile: string;

  private constructor() {
    this.enabled = DEBUG_MODE;
    this.logFile = path.join(process.cwd(), 'axe-handle-debug.log');
    
    // Clear log file on startup if debug is enabled
    if (this.enabled) {
      try {
        fs.writeFileSync(this.logFile, `=== Axe Handle Debug Log (${new Date().toISOString()}) ===\n\n`, 'utf-8');
      } catch (error) {
        console.warn('Failed to initialize debug log file');
      }
    }
  }

  /**
   * Gets the singleton instance of the DebugLogger.
   */
  public static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  /**
   * Enables or disables debug logging
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Logs a debug message if debug mode is enabled
   */
  public log(message: string, context?: any): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${message}`;
    
    if (context) {
      logMessage += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    // Output to console with [DEBUG] prefix
    console.log(`[DEBUG] ${message}`);
    
    // Append to log file
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n\n', 'utf-8');
    } catch (error) {
      console.warn('Failed to write to debug log file');
    }
  }

  /**
   * Creates a checkpoint in the debug log
   */
  public checkpoint(name: string): void {
    if (!this.enabled) return;
    
    const separator = '='.repeat(50);
    this.log(`${separator}\nCHECKPOINT: ${name}\n${separator}`);
  }

  /**
   * Logs detailed information about templates
   */
  public logTemplateInfo(templateDir: string): void {
    if (!this.enabled) return;
    
    this.checkpoint('Template Information');
    
    try {
      if (!fs.existsSync(templateDir)) {
        this.log(`Template directory not found: ${templateDir}`);
        return;
      }
      
      // Log directory structure
      this.log(`Template directory: ${templateDir}`);
      const templates = this.listFilesRecursively(templateDir);
      
      this.log(`Found ${templates.length} template files:`);
      templates.forEach(template => {
        this.log(`- ${path.relative(templateDir, template)}`);
      });
    } catch (error) {
      this.log(`Error getting template info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lists all files in a directory recursively
   */
  private listFilesRecursively(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(this.listFilesRecursively(filePath));
      } else {
        results.push(filePath);
      }
    });
    
    return results;
  }

  /**
   * Logs detailed information about an error
   */
  public logError(error: Error | AxeError, context?: string): void {
    if (!this.enabled) return;
    
    this.checkpoint(`ERROR${context ? ' in ' + context : ''}`);
    
    if ('code' in error) {
      const axeError = error as AxeError;
      this.log(`Error Code: ${axeError.code}`);
      this.log(`Message: ${axeError.message}`);
      
      if (axeError.details) {
        this.log(`Details: ${JSON.stringify(axeError.details, null, 2)}`);
      }
      
      if (axeError.cause) {
        this.log('Caused by:', axeError.cause);
      }
    } else {
      this.log(`Error: ${error.message}`);
      this.log(`Stack: ${error.stack}`);
    }
  }
}

// Export singleton instance
export const debugLogger = DebugLogger.getInstance();

/**
 * Wraps a function with debug logging
 */
export function withDebugLogging<T extends (...args: any[]) => any>(
  fn: T,
  functionName: string
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    if (!DEBUG_MODE) return fn(...args);
    
    debugLogger.checkpoint(`BEGIN ${functionName}`);
    debugLogger.log(`Arguments: ${JSON.stringify(args, null, 2)}`);
    
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result
          .then(value => {
            debugLogger.log(`${functionName} completed successfully`);
            return value;
          })
          .catch(error => {
            debugLogger.logError(error, functionName);
            throw error;
          }) as ReturnType<T>;
      }
      
      debugLogger.log(`${functionName} completed successfully`);
      return result;
    } catch (error) {
      debugLogger.logError(error instanceof Error ? error : new Error(String(error)), functionName);
      throw error;
    }
  };
}

/**
 * Enable debug mode for the current session
 */
export function enableDebugMode(): void {
  process.env.AXE_HANDLE_DEBUG = 'true';
  debugLogger.setEnabled(true);
  debugLogger.checkpoint('Debug Mode Enabled');
}

/**
 * Disable debug mode for the current session
 */
export function disableDebugMode(): void {
  process.env.AXE_HANDLE_DEBUG = 'false';
  debugLogger.setEnabled(false);
}
