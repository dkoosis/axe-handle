import { AxeError, ErrorPrefix, AxeErrorCategory, McpErrorCategory } from '../types';
/**
 * Creates an Axe Handle error.
 * @param prefix Error prefix (AXE or MCP)
 * @param category Error category
 * @param code Numeric error code within the category
 * @param message Human-readable error message
 * @param details Additional details about the error (e.g., file name, line number)
 * @param cause Underlying error, if any
 * @returns A structured AxeError object
 */
export declare function createError(prefix: ErrorPrefix, category: AxeErrorCategory | McpErrorCategory, code: number, message: string, details?: Record<string, unknown>, cause?: Error | AxeError): AxeError;
/**
 * Creates an Axe Handle parser error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export declare function createParserError(code: number, message: string, details?: Record<string, unknown>, cause?: Error | AxeError): AxeError;
/**
 * Creates an Axe Handle CLI error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export declare function createCliError(code: number, message: string, details?: Record<string, unknown>, cause?: Error | AxeError): AxeError;
/**
 * Creates an Axe Handle generator error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export declare function createGeneratorError(code: number, message: string, details?: Record<string, unknown>, cause?: Error | AxeError): AxeError;
/**
 * Creates an Axe Handle mapper error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export declare function createMapperError(code: number, message: string, details?: Record<string, unknown>, cause?: Error | AxeError): AxeError;
/**
 * Creates an MCP specification error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export declare function createMcpSpecError(code: number, message: string, details?: Record<string, unknown>, cause?: Error | AxeError): AxeError;
/**
 * Creates an MCP runtime error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export declare function createMcpRuntimeError(code: number, message: string, details?: Record<string, unknown>, cause?: Error | AxeError): AxeError;
/**
 * Formats an error message for CLI display with proper coloring.
 * This function should be used in the CLI module to format error messages
 * before displaying them to the user.
 *
 * @param error The error to format
 * @returns Formatted error message ready for CLI display
 */
export declare function formatErrorForCli(error: Error | AxeError): string;
/**
 * Wraps a function with error handling logic.
 * If the function throws an error, it will be caught and wrapped in an AxeError.
 *
 * @param fn The function to wrap
 * @param errorCreator A function that creates an AxeError
 * @returns A wrapped function
 */
export declare function withErrorHandling<T extends (...args: any[]) => any>(fn: T, errorCreator: (code: number, message: string, details?: Record<string, unknown>, cause?: Error) => AxeError): (...args: Parameters<T>) => ReturnType<T>;
