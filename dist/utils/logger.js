"use strict";
// Path: src/utils/logger.ts
// Provides a centralized logging system for the Axe Handle code generator.
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LoggerManager = exports.LogLevel = void 0;
exports.getLoggerManager = getLoggerManager;
exports.getLogger = getLogger;
/**
 * Log levels in order of increasing severity.
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Logger Manager.
 * Responsible for creating and managing loggers.
 */
class LoggerManager {
    /**
     * Creates a new LoggerManager.
     * @param config Logger configuration
     */
    constructor(config) {
        this.loggers = new Map();
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
    static getInstance(config) {
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
    getLogger(moduleName) {
        // Check if the logger already exists
        if (this.loggers.has(moduleName)) {
            return this.loggers.get(moduleName);
        }
        // Create a new logger
        const logger = {
            debug: (message, context) => {
                this.log(LogLevel.DEBUG, moduleName, message, undefined, context);
            },
            info: (message, context) => {
                this.log(LogLevel.INFO, moduleName, message, undefined, context);
            },
            warn: (message, context) => {
                this.log(LogLevel.WARN, moduleName, message, undefined, context);
            },
            error: (message, error, context) => {
                this.log(LogLevel.ERROR, moduleName, message, error, context);
            },
            setLevel: (level) => {
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
    log(level, moduleName, message, error, context) {
        // Check if the log level is high enough
        if (level < this.config.level) {
            return;
        }
        // Format the message
        let formattedMessage;
        if (this.config.formatter) {
            formattedMessage = this.config.formatter(level, message, context);
        }
        else {
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
    formatMessage(level, moduleName, message) {
        // Build timestamp
        const timestamp = this.config.timestamps ? `[${new Date().toISOString()}] ` : '';
        // Build level string
        let levelStr;
        if (this.config.colors) {
            switch (level) {
                case LogLevel.DEBUG:
                    levelStr = '\x1b[34mDEBUG\x1b[0m'; // Blue
                    break;
                case LogLevel.INFO:
                    levelStr = '\x1b[32mINFO\x1b[0m'; // Green
                    break;
                case LogLevel.WARN:
                    levelStr = '\x1b[33mWARN\x1b[0m'; // Yellow
                    break;
                case LogLevel.ERROR:
                    levelStr = '\x1b[31mERROR\x1b[0m'; // Red
                    break;
                default:
                    levelStr = String(level);
            }
        }
        else {
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
    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config
        };
    }
    /**
     * Sets the global log level.
     * @param level New log level
     */
    setLevel(level) {
        this.config.level = level;
    }
}
exports.LoggerManager = LoggerManager;
// Export a function to get the singleton instance
function getLoggerManager(config) {
    return LoggerManager.getInstance(config);
}
// Export a function to get a logger for a module
function getLogger(moduleName) {
    return getLoggerManager().getLogger(moduleName);
}
// Export the root logger
exports.logger = getLogger('root');
//# sourceMappingURL=logger.js.map