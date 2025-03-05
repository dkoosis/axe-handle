// Path: src/utils/errorUtils.ts
// Provides centralized error handling utilities for the Axe Handle code generator.

import { AxeError, ErrorPrefix, AxeErrorCategory, McpErrorCategory } from '../types';
import { logger, LogCategory } from './logger';

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
export function createError(
  prefix: ErrorPrefix,
  category: AxeErrorCategory | McpErrorCategory,
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return {
    code: `${prefix}-${category}${String(code).padStart(3, '0')}`,
    message,
    details,
    cause,
  };
}

/**
 * Creates an Axe Handle parser error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export function createParserError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return createError(
    ErrorPrefix.AXE,
    AxeErrorCategory.PARSER,
    code,
    message,
    details,
    cause
  );
}

/**
 * Creates an Axe Handle CLI error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export function createCliError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return createError(
    ErrorPrefix.AXE,
    AxeErrorCategory.CLI,
    code,
    message,
    details,
    cause
  );
}

/**
 * Creates an Axe Handle generator error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export function createGeneratorError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return createError(
    ErrorPrefix.AXE,
    AxeErrorCategory.GENERATOR,
    code,
    message,
    details,
    cause
  );
}

/**
 * Creates an Axe Handle mapper error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export function createMapperError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return createError(
    ErrorPrefix.AXE,
    AxeErrorCategory.MAPPER,
    code,
    message,
    details,
    cause
  );
}

/**
 * Creates an MCP protocol error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export function createMcpProtocolError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return createError(
    ErrorPrefix.MCP,
    McpErrorCategory.PROTOCOL,
    code,
    message,
    details,
    cause
  );
}

/**
 * Creates an MCP runtime error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
export function createMcpRuntimeError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return createError(
    ErrorPrefix.MCP,
    McpErrorCategory.RUNTIME,
    code,
    message,
    details,
    cause
  );
}

/**
 * Formats an error message for display with proper structure.
 * @param error The error to format
 * @returns Formatted error message
 */
export function formatError(error: Error | AxeError): string {
  if ('code' in error) {
    const axeError = error as AxeError;
    let message = `ERROR ${axeError.code}: ${axeError.message}`;
    
    if (axeError.details) {
      message += '\n\nDetails:';
      for (const [key, value] of Object.entries(axeError.details)) {
        message += `\n  ${key}: ${value}`;
      }
    }
    
    if (axeError.cause) {
      message += `\n\nCaused by: ${formatError(axeError.cause)}`;
    }
    
    return message;
  } else {
    return `ERROR: ${error.message}`;
  }
}

/**
 * Error handler function type.
 */
type ErrorHandlerFunction<T extends (...args: any[]) => any> = 
  (...args: Parameters<T>) => ReturnType<T>;

/**
 * Wraps a synchronous function with error handling.
 * @param fn The function to wrap
 * @param errorCreator A function that creates an AxeError
 * @returns A wrapped function with error handling
 */
/**
 * Wraps a synchronous function with error handling.
 * @param fn The function to wrap
 * @param errorCreator A function that creates an AxeError
 * @returns A wrapped function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  errorCreator: (code: number, message: string, details?: Record<string, unknown>, cause?: Error) => AxeError,
  category: LogCategory = LogCategory.GENERAL
): ErrorHandlerFunction<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, rethrow
        logger.error(`Error in function ${fn.name}: ${error.message}`, category);
        throw error;
      }
      
      const wrappedError = errorCreator(
        999, // Generic error code
        `An unexpected error occurred in ${fn.name}`,
        { function: fn.name, args: JSON.stringify(args) },
        error instanceof Error ? error : new Error(String(error))
      );
      
      logger.error(`Wrapped error in function ${fn.name}: ${wrappedError.message}`, category);
      throw wrappedError;
    }
  };
}

/**
 * Wraps an async function with error handling.
 * @param fn The async function to wrap
 * @param errorCreator A function that creates an AxeError
 * @returns A wrapped async function with error handling
 */
export function withAsyncErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorCreator: (code: number, message: string, details?: Record<string, unknown>, cause?: Error) => AxeError,
  category: LogCategory = LogCategory.GENERAL
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, rethrow
        logger.error(`Async error in function ${fn.name}: ${error.message}`, category);
        throw error;
      }
      
      const wrappedError = errorCreator(
        999, // Generic error code
        `An unexpected error occurred in async function ${fn.name}`,
        { function: fn.name, args: JSON.stringify(args) },
        error instanceof Error ? error : new Error(String(error))
      );
      
      logger.error(`Wrapped async error in function ${fn.name}: ${wrappedError.message}`, category);
      throw wrappedError;
    }
  };
}