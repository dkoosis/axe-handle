// src/utils/logger.ts
import chalk from 'chalk';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

/**
 * Log categories
 */
export enum LogCategory {
  GENERAL = 'general',
  TEMPLATE = 'template',
  PARSER = 'parser',
  GENERATOR = 'generator',
  CONFIG = 'config',
  CLI = 'cli'
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Current verbosity level */
  level: LogLevel;
  /** Whether to use color */
  colors: boolean;
  /** Whether to show timestamps */
  timestamps: boolean;
  /** Categories to filter (if empty, show all) */
  categories: LogCategory[];
}

/**
 * Enhanced logger for providing structured logs
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  
  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      colors: config.colors ?? true,
      timestamps: config.timestamps ?? false,
      categories: config.categories ?? Object.values(LogCategory)
    };
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      Logger.instance.updateConfig(config);
    }
    
    return Logger.instance;
  }
  
  /**
   * Update logger configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Format a message with timestamp and category
   */
  private format(level: LogLevel, category: LogCategory, message: string): string {
    const parts: string[] = [];
    
    // Add timestamp if enabled
    if (this.config.timestamps) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }
    
    // Add level and category
    let levelStr: string;
    switch (level) {
      case LogLevel.DEBUG:
        levelStr = this.config.colors ? chalk.gray('DEBUG') : 'DEBUG';
        break;
      case LogLevel.INFO:
        levelStr = this.config.colors ? chalk.blue('INFO') : 'INFO';
        break;
      case LogLevel.WARN:
        levelStr = this.config.colors ? chalk.yellow('WARN') : 'WARN';
        break;
      case LogLevel.ERROR:
        levelStr = this.config.colors ? chalk.red('ERROR') : 'ERROR';
        break;
      default:
        levelStr = '';
    }
    
    const categoryStr = this.config.colors
      ? chalk.cyan(`[${category}]`)
      : `[${category}]`;
    
    parts.push(levelStr);
    parts.push(categoryStr);
    
    // Add the message
    parts.push(message);
    
    return parts.join(' ');
  }
  
  /**
   * Log a debug message
   */
  public debug(message: string, category: LogCategory = LogCategory.GENERAL): void {
    if (this.config.level <= LogLevel.DEBUG && this.shouldLogCategory(category)) {
      console.log(this.format(LogLevel.DEBUG, category, message));
    }
  }
  
  /**
   * Log an info message
   */
  public info(message: string, category: LogCategory = LogCategory.GENERAL): void {
    if (this.config.level <= LogLevel.INFO && this.shouldLogCategory(category)) {
      console.log(this.format(LogLevel.INFO, category, message));
    }
  }
  
  /**
   * Log a warning message
   */
  public warn(message: string, category: LogCategory = LogCategory.GENERAL): void {
    if (this.config.level <= LogLevel.WARN && this.shouldLogCategory(category)) {
      console.log(this.format(LogLevel.WARN, category, message));
    }
  }
  
  /**
   * Log an error message
   */
  public error(message: string, category: LogCategory = LogCategory.GENERAL): void {
    if (this.config.level <= LogLevel.ERROR && this.shouldLogCategory(category)) {
      console.log(this.format(LogLevel.ERROR, category, message));
    }
  }
  
  /**
   * Log a section header
   */
  public section(title: string): void {
    if (this.config.level <= LogLevel.INFO) {
      console.log('');
      console.log(this.config.colors ? chalk.cyan.bold(title) : title);
      console.log(this.config.colors ? chalk.cyan('─'.repeat(title.length)) : '─'.repeat(title.length));
    }
  }
  
  /**
   * Log a success message
   */
  public success(message: string, category: LogCategory = LogCategory.GENERAL): void {
    if (this.config.level <= LogLevel.INFO && this.shouldLogCategory(category)) {
      const parts = [
        this.config.colors ? chalk.green('SUCCESS') : 'SUCCESS',
        this.config.colors ? chalk.cyan(`[${category}]`) : `[${category}]`,
        this.config.colors ? chalk.green(message) : message
      ];
      
      console.log(parts.join(' '));
    }
  }
  
  /**
   * Check if a category should be logged
   */
  private shouldLogCategory(category: LogCategory): boolean {
    return this.config.categories.length === 0 || this.config.categories.includes(category);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();