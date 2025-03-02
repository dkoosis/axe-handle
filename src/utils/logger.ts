// Path: src/utils/logger.ts
// Provides a centralized logging system for the Axe Handle code generator.

/**
 * Log levels in order of increasing severity.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/**
 * Logger configuration.
 */

export interface LoggerConfig {
  /** Minimum log level to display */
  level: LogLevel;
  /** Whether to include timestamps in log messages */
  timestamps: boolean;
  /** Whether to use colors in log output */
  colors: boolean;
  /** Custom formatter for log messages */
  formatter?: (level: LogLevel, message: string, context?: object) => string;
}

/**
 * A module-specific logger instance.
 */
export interface Logger {
  /** Log a debug message */
  debug(message: string, context?: object): void;
  /** Log an info message */
  info(message: string, context?: object): void;
  /** Log a warning message */
  warn(message: string, context?: object): void;
  /** Log an error message */
  error(message: string, error?: Error, context?: object): void;
  /** Set the log level for this logger */
  setLevel(level: LogLevel): void;
}

/**
 * Logger Manager.
 * Responsible for creating and managing loggers.
 */
export class LoggerManager {
  private static instance: LoggerManager;
  
  private config: LoggerConfig;
  private loggers: Map<string, Logger> = new Map();
  
  /**
   * Creates a new LoggerManager.
   * @param config Logger configuration
   */
  private constructor(config: Partial<LoggerConfig>) {
    const { level = LogLevel.INFO, timestamps = true, colors = true, ...restConfig } = config;
    this.config = {
      level,
      timestamps,
      colors,
      ...restConfig
    };
  }
  
  /**
   * Gets the singleton instance of the LoggerManager.
   * @param config Logger configuration (optional, only used on first call)
   * @returns The LoggerManager instance
   */
  public static getInstance(config?: Partial<LoggerConfig>): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager(config || {});
    }
    return LoggerManager.instance;
  }
  
  /**
   * Gets or creates a logger for a module.
   * @param moduleName Name of the module
   * @returns A logger instance
   */
  public getLogger(moduleName: string): Logger {
    // Check if the logger already exists
    if (this.loggers.has(moduleName)) {
      return this.loggers.get(moduleName)!;
    }
    
    // Create a new logger
    const logger: Logger = {
      debug: (message: string, context?: object) => {
        this.log(LogLevel.DEBUG, moduleName, message, undefined, context);
      },
      info: (message: string, context?: object) => {
        this.log(LogLevel.INFO, moduleName, message, undefined, context);
      },
      warn: (message: string, context?: object) => {
        this.log(LogLevel.WARN, moduleName, message, undefined, context);
      },
      error: (message: string, error?: Error, context?: object) => {
        this.log(LogLevel.ERROR, moduleName, message, error, context);
      },
      setLevel: (level: LogLevel) => {
        // This would typically set a module-specific level,
        // but for simplicity we're just setting the global level
        this.config.level = level;
      }
    };
    
    // Store the logger
    this.loggers.set(moduleName, logger);
    
    return logger;
  }
  
  /**
   * Logs a message.
   * @param level Log level
   * @param moduleName Name of the module
   * @param message Message to log
   * @param error Optional error object
   * @param context Optional context object
   */
  private log(
    level: LogLevel,
    moduleName: string,
    message: string,
    error?: Error,
    context?: object
  ): void {
    // Check if the log level is high enough
    if (level < this.config.level) {
      return;
    }
    
    // Format the message
    let formattedMessage: string;
    
    if (this.config.formatter) {
      formattedMessage = this.config.formatter(level, message, context);
    } else {
      formattedMessage = this.formatMessage(level, moduleName, message);
    }
    
    // Output the message
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (error) {
          console.error(error);
        }
        break;
    }
    
    // Log context if provided
    if (context) {
      console.log(context);
    }
  }
  
  /**
   * Formats a log message.
   * @param level Log level
   * @param moduleName Name of the module
   * @param message Message to log
   * @returns Formatted message
   */
  private formatMessage(level: LogLevel, moduleName: string, message: string): string {
    // Build timestamp
    const timestamp = this.config.timestamps ? `[${new Date().toISOString()}] ` : '';
    
    // Build level string
    let levelStr: string;
    
    if (this.config.colors) {
      switch (level) {
        case LogLevel.DEBUG:
          levelStr = '\x1b[34mDEBUG\x1b[0m'; // Blue
          break;
        case LogLevel.INFO:
          levelStr = '\x1b[32mINFO\x1b[0m';  // Green
          break;
        case LogLevel.WARN:
          levelStr = '\x1b[33mWARN\x1b[0m';  // Yellow
          break;
        case LogLevel.ERROR:
          levelStr = '\x1b[31mERROR\x1b[0m'; // Red
          break;
        default:
          levelStr = String(level);
      }
    } else {
      switch (level) {
        case LogLevel.DEBUG:
          levelStr = 'DEBUG';
          break;
        case LogLevel.INFO:
          levelStr = 'INFO';
          break;
        case LogLevel.WARN:
          levelStr = 'WARN';
          break;
        case LogLevel.ERROR:
          levelStr = 'ERROR';
          break;
        default:
          levelStr = String(level);
      }
    }
    
    // Build module string
    const moduleStr = moduleName ? `[${moduleName}] ` : '';
    
    // Build final message
    return `${timestamp}${levelStr} ${moduleStr}${message}`;
  }
  
  /**
   * Updates the logger configuration.
   * @param config New logger configuration
   */
  public updateConfig(config: Partial<LoggerConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Sets the global log level.
   * @param level New log level
   */
  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }
}

// Export a function to get the singleton instance
export function getLoggerManager(config?: Partial<LoggerConfig>): LoggerManager {
  return LoggerManager.getInstance(config);
}

// Export a function to get a logger for a module
export function getLogger(moduleName: string): Logger {
  return getLoggerManager().getLogger(moduleName);
}

// Export the root logger
export const logger = getLogger('root');