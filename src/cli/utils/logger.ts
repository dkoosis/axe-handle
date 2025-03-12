// Path: src/cli/utils/logger.ts
/**
 * @file src/cli/utils/logger.ts
 * @description Logger utility for the Axe Handle generator
 * @author Axe Handle Team
 * @created 2025-03-12
 * @copyright Copyright (c) 2025 Axe Handle Project
 * @license ISC
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogCategory {
  PARSER = 'Parser',
  GENERATOR = 'Generator',
  TEMPLATE = 'Template',
  INFO = 'Info',
  ERROR = 'Error',
}

/**
 * Logger utility for the Axe Handle generator
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {}

  /**
   * Update logger configuration
   * @param _config Logger configuration
   */
  public updateConfig(_config: any): void {
    // Implementation will be added later
    // Currently unused parameter is prefixed with underscore
  }

  /**
   * Get the singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!this.instance) {
      this.instance = new Logger();
    }
    return this.instance;
  }

  /**
   * Log a message
   * @param category Log category
   * @param message Log message
   * @param level Log level
   */
  public log(category: LogCategory, message: string, level: LogLevel = LogLevel.INFO): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${category}]`;

    switch (level) {
      case LogLevel.ERROR:
        console.error(`${prefix} ERROR: ${message}`);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} WARN: ${message}`);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} INFO: ${message}`);
        break;
      case LogLevel.DEBUG:
        console.debug(`${prefix} DEBUG: ${message}`);
        break;
    }
  }

  /**
   * Set the log level
   * @param level Log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log an info message
   * @param message Message to log
   */
  public info(message: string): void {
    this.log(LogCategory.INFO, message, LogLevel.INFO);
  }

  /**
   * Log a debug message
   * @param message Message to log
   */
  public debug(message: string): void {
    this.log(LogCategory.INFO, message, LogLevel.DEBUG);
  }

  /**
   * Log an error message
   * @param message Message to log
   */
  public error(message: string): void {
    this.log(LogCategory.ERROR, message, LogLevel.ERROR);
  }

  /**
   * Log a warning message
   * @param message Message to log
   */
  public warn(message: string): void {
    this.log(LogCategory.INFO, message, LogLevel.WARN);
  }

  /**
   * Log a success message
   * @param message Message to log
   */
  public success(message: string): void {
    console.log(`✅ ${message}`);
  }

  /**
   * Log a section header
   * @param title Section title
   */
  public section(title: string): void {
    console.log(`\n===== ${title.toUpperCase()} =====\n`);
  }
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();

/**
 * Helper function to format an error for logging
 * @param error Error to format
 * @returns Formatted error string
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
