/**
 * Log levels in order of increasing severity.
 */
export declare enum LogLevel {
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
export declare class LoggerManager {
    private static instance;
    private config;
    private loggers;
    /**
     * Creates a new LoggerManager.
     * @param config Logger configuration
     */
    private constructor();
    /**
     * Gets the singleton instance of the LoggerManager.
     * @param config Logger configuration (optional, only used on first call)
     * @returns The LoggerManager instance
     */
    static getInstance(config?: Partial<LoggerConfig>): LoggerManager;
    /**
     * Gets or creates a logger for a module.
     * @param moduleName Name of the module
     * @returns A logger instance
     */
    getLogger(moduleName: string): Logger;
    /**
     * Logs a message.
     * @param level Log level
     * @param moduleName Name of the module
     * @param message Message to log
     * @param error Optional error object
     * @param context Optional context object
     */
    private log;
    /**
     * Formats a log message.
     * @param level Log level
     * @param moduleName Name of the module
     * @param message Message to log
     * @returns Formatted message
     */
    private formatMessage;
    /**
     * Updates the logger configuration.
     * @param config New logger configuration
     */
    updateConfig(config: Partial<LoggerConfig>): void;
    /**
     * Sets the global log level.
     * @param level New log level
     */
    setLevel(level: LogLevel): void;
}
export declare function getLoggerManager(config?: Partial<LoggerConfig>): LoggerManager;
export declare function getLogger(moduleName: string): Logger;
export declare const logger: Logger;
