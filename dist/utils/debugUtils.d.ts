import { AxeError } from '../types';
/**
 * Logger for debug information
 */
export declare class DebugLogger {
    private static instance;
    private enabled;
    private logFile;
    private constructor();
    /**
     * Gets the singleton instance of the DebugLogger.
     */
    static getInstance(): DebugLogger;
    /**
     * Enables or disables debug logging
     */
    setEnabled(enabled: boolean): void;
    /**
     * Logs a debug message if debug mode is enabled
     */
    log(message: string, context?: any): void;
    /**
     * Creates a checkpoint in the debug log
     */
    checkpoint(name: string): void;
    /**
     * Logs detailed information about templates
     */
    logTemplateInfo(templateDir: string): void;
    /**
     * Lists all files in a directory recursively
     */
    private listFilesRecursively;
    /**
     * Logs detailed information about an error
     */
    logError(error: Error | AxeError, context?: string): void;
}
export declare const debugLogger: DebugLogger;
/**
 * Wraps a function with debug logging
 */
export declare function withDebugLogging<T extends (...args: any[]) => any>(fn: T, functionName: string): (...args: Parameters<T>) => ReturnType<T>;
/**
 * Enable debug mode for the current session
 */
export declare function enableDebugMode(): void;
/**
 * Disable debug mode for the current session
 */
export declare function disableDebugMode(): void;
