// Path: src/utils/logger.ts
// Enhanced console logging for the Axe Handle CLI

import chalk from 'chalk';

/**
 * Log levels for CLI output
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SUCCESS = 4,
  SILENT = 5
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Current verbosity level */
  verbose: boolean;
  /** Current log level */
  level: LogLevel;
  /** Whether to use color */
  colors: boolean;
  /** Whether to show timestamps */
  timestamps: boolean;
  /** Whether to show prefixes for log levels */
  prefixes: boolean;
}

/**
 * CLI Logger - Manages console output with different styling for different message types
 */
export class CliLogger {
  private static instance: CliLogger;
  private config: LoggerConfig;
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      verbose: config.verbose ?? false,
      level: config.level ?? LogLevel.INFO,
      colors: config.colors ?? true,
      timestamps: config.timestamps ?? false,
      prefixes: config.prefixes ?? true
    };
  }
  
  /**
   * Get the singleton instance of CliLogger
   */
  public static getInstance(config?: Partial<LoggerConfig>): CliLogger {
    if (!CliLogger.instance) {
      CliLogger.instance = new CliLogger(config);
    } else if (config) {
      // Update existing instance config
      CliLogger.instance.updateConfig(config);
    }
    return CliLogger.instance;
  }
  
  /**
   * Update logger configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Set verbose mode on/off
   */
  public setVerbose(verbose: boolean): void {
    this.config.verbose = verbose;
  }
  
  /**
   * Format a message with optional prefix and timestamp
   */
  private format(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    // Add timestamp if enabled
    if (this.config.timestamps) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }
    
    // Add prefix if enabled
    if (this.config.prefixes) {
      let prefix: string;
      
      switch (level) {
        case LogLevel.DEBUG:
          prefix = this.config.colors ? chalk.gray('DEBUG') : 'DEBUG';
          break;
        case LogLevel.INFO:
          prefix = this.config.colors ? chalk.white('INFO') : 'INFO';
          break;
        case LogLevel.WARN:
          prefix = this.config.colors ? chalk.yellow('WARN') : 'WARN';
          break;
        case LogLevel.ERROR:
          prefix = this.config.colors ? chalk.red('ERROR') : 'ERROR';
          break;
        case LogLevel.SUCCESS:
          prefix = this.config.colors ? chalk.green('SUCCESS') : 'SUCCESS';
          break;
        default:
          prefix = '';
      }
      
      if (prefix) {
        parts.push(prefix);
      }
    }
    
    // Add the message
    parts.push(message);
    
    return parts.join(' ');
  }
  
  /**
   * Log a debug message (only in verbose mode)
   */
  public debug(message: string): void {
    if (this.config.level <= LogLevel.DEBUG && this.config.verbose) {
      const formattedMessage = this.format(LogLevel.DEBUG, message);
      console.log(this.config.colors ? chalk.gray(formattedMessage) : formattedMessage);
    }
  }
  
  /**
   * Log an info message (plain white)
   */
  public info(message: string): void {
    if (this.config.level <= LogLevel.INFO) {
      if (this.config.verbose || !message.includes('template') && !message.includes('Template')) {
        const formattedMessage = this.format(LogLevel.INFO, message);
        // Use white for all info messages
        console.log(formattedMessage);
      }
    }
  }
  
  /**
   * Log a warning message (yellow)
   */
  public warn(message: string): void {
    if (this.config.level <= LogLevel.WARN) {
      const prefix = this.config.colors ? chalk.yellow('WARN') : 'WARN';
      // Apply yellow color to the entire message
      const text = this.config.colors ? chalk.yellow(message) : message;
      console.log(`${prefix} ${text}`);
    }
  }
  
  /**
   * Log an error message (red)
   */
  public error(message: string): void {
    if (this.config.level <= LogLevel.ERROR) {
      const prefix = this.config.colors ? chalk.red.bold('ERROR') : 'ERROR';
      // Apply red color to the entire message
      const text = this.config.colors ? chalk.red(message) : message;
      console.log(`${prefix} ${text}`);
    }
  }
  
  /**
   * Log a success message (green)
   */
  public success(message: string): void {
    if (this.config.level <= LogLevel.SUCCESS) {
      const prefix = this.config.colors ? chalk.green('SUCCESS') : 'SUCCESS';
      // Apply green color to the entire message
      const text = this.config.colors ? chalk.green(message) : message;
      console.log(`${prefix} ${text}`);
    }
  }
  
  /**
   * Log a section header (for separating logical sections of output)
   */
  public section(title: string): void {
    if (this.config.level <= LogLevel.INFO) {
      console.log('');
      console.log(this.config.colors ? chalk.cyan.bold(title) : title);
      console.log(this.config.colors ? chalk.cyan('─'.repeat(title.length)) : '─'.repeat(title.length));
    }
  }
  
  /**
   * Log a summary line (for highlighting important information)
   */
  public summary(message: string): void {
    if (this.config.level <= LogLevel.INFO) {
      console.log('');
      console.log(this.config.colors ? chalk.bold(message) : message);
    }
  }
}

// Export singleton instance
export const logger = CliLogger.getInstance();
