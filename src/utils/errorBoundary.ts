// src/utils/errorBoundary.ts
import { AxeError } from '../types';
import { createGeneratorError, formatErrorForCli } from './errorUtils';
import { logger, LogCategory } from './logger';
import { performance } from './performanceUtils';

/**
 * Error boundary options
 */
interface ErrorBoundaryOptions {
  /** Operation name for logging and performance tracking */
  operation: string;
  /** Category for logging */
  category: LogCategory;
  /** Whether to continue execution on error */
  continueOnError?: boolean;
  /** Custom error handler */
  onError?: (error: Error | AxeError) => void;
  /** Error code for wrapped errors */
  errorCode?: number;
}

/**
 * Creates an error boundary around an async function
 */
export function createAsyncErrorBoundary<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: ErrorBoundaryOptions
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    logger.debug(`Starting operation: ${options.operation}`, options.category);
    
    // Track performance
    return performance.track(
      options.operation,
      async () => {
        try {
          // Execute the function
          return await fn(...args);
        } catch (error) {
          logger.error(
            `Error in operation ${options.operation}: ${error instanceof Error ? error.message : String(error)}`, 
            options.category
          );
          
          // Call custom error handler if provided
          if (options.onError && error instanceof Error) {
            options.onError(error);
          }
          
          // Format and check error type
          if (error instanceof Error && 'code' in error) {
            // This is already an AxeError, pass it through
            if (!options.continueOnError) {
              throw error;
            }
            // Log detailed error but continue
            logger.debug(formatErrorForCli(error as AxeError), options.category);
            return undefined as unknown as T;
          }
          
          // Wrap other errors in an AxeError
          const axeError = createGeneratorError(
            options.errorCode || 9000, // General error code
            `Error in ${options.operation}`,
            { operation: options.operation },
            error instanceof Error ? error : new Error(String(error))
          );
          
          if (!options.continueOnError) {
            throw axeError;
          }
          
          // Log detailed error but continue
          logger.debug(formatErrorForCli(axeError), options.category);
          return undefined as unknown as T;
        }
      },
      { args: args.length > 0 ? args : undefined }
    );
  };
}

/**
 * Creates an error boundary around a sync function
 */
export function createSyncErrorBoundary<T, Args extends any[]>(
  fn: (...args: Args) => T,
  options: ErrorBoundaryOptions
): (...args: Args) => T {
  return (...args: Args): T => {
    logger.debug(`Starting operation: ${options.operation}`, options.category);
    
    // Track performance
    return performance.trackSync(
      options.operation,
      () => {
        try {
          // Execute the function
          return fn(...args);
        } catch (error) {
          logger.error(
            `Error in operation ${options.operation}: ${error instanceof Error ? error.message : String(error)}`, 
            options.category
          );
          
          // Call custom error handler if provided
          if (options.onError && error instanceof Error) {
            options.onError(error);
          }
          
          // Format and check error type
          if (error instanceof Error && 'code' in error) {
            // This is already an AxeError, pass it through
            if (!options.continueOnError) {
              throw error;
            }
            // Log detailed error but continue
            logger.debug(formatErrorForCli(error as AxeError), options.category);
            return undefined as unknown as T;
          }
          
          // Wrap other errors in an AxeError
          const axeError = createGeneratorError(
            options.errorCode || 9000, // General error code
            `Error in ${options.operation}`,
            { operation: options.operation },
            error instanceof Error ? error : new Error(String(error))
          );
          
          if (!options.continueOnError) {
            throw axeError;
          }
          
          // Log detailed error but continue
          logger.debug(formatErrorForCli(axeError), options.category);
          return undefined as unknown as T;
        }
      },
      { args: args.length > 0 ? args : undefined }
    );
  };
}