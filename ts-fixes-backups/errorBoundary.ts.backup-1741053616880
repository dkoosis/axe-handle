// Path: src/utils/errorBoundary.ts
import { AxeError } from '../types';
import { createGeneratorError } from './errorUtils';
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
 * Creates an error boundary around an async function with improved error handling
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
          // Create a better error message
          let errorMessage = "Unknown error";
          
          if (error instanceof Error) {
            errorMessage = error.message;
            logger.debug(`Stack trace: ${error.stack || 'No stack trace available'}`, options.category);
          } else if (error !== null && typeof error === 'object') {
            try {
              errorMessage = JSON.stringify(error);
            } catch {
              errorMessage = "Unserializable error object";
            }
          } else {
            errorMessage = String(error);
          }
          
          logger.error(
            `Error in operation ${options.operation}: ${errorMessage}`, 
            options.category
          );
          
          // Call custom error handler if provided
          if (options.onError && error instanceof Error) {
            options.onError(error);
          }
          
          // Handle AxeError objects directly
          if (error instanceof Error && 'code' in error) {
            if (!options.continueOnError) {
              throw error;
            }
            
            logger.debug(`Continuing after error: ${errorMessage}`, options.category);
            return undefined as unknown as T;
          }
          
          // Wrap other errors with better details
          const errorDetails: Record<string, unknown> = { 
            operation: options.operation
          };
          
          // Extract more details from the error
          if (error !== null && typeof error === 'object') {
            for (const key in error) {
              try {
                if (key !== 'stack' && key !== 'message') {
                  errorDetails[key] = error[key];
                }
              } catch {
                // Ignore property access errors
              }
            }
          }
          
          const axeError = createGeneratorError(
            options.errorCode || 9000,
            `Error in ${options.operation}: ${errorMessage}`,
            errorDetails,
            error instanceof Error ? error : new Error(errorMessage)
          );
          
          if (!options.continueOnError) {
            throw axeError;
          }
          
          logger.debug(`Continuing after wrapped error: ${errorMessage}`, options.category);
          return undefined as unknown as T;
        }
      },
      { args: args.length > 0 ? args : undefined }
    );
  };
}

/**
 * Creates an error boundary around a sync function with improved error handling
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
          // Create a better error message
          let errorMessage = "Unknown error";
          
          if (error instanceof Error) {
            errorMessage = error.message;
            logger.debug(`Stack trace: ${error.stack || 'No stack trace available'}`, options.category);
          } else if (error !== null && typeof error === 'object') {
            try {
              errorMessage = JSON.stringify(error);
            } catch {
              errorMessage = "Unserializable error object";
            }
          } else {
            errorMessage = String(error);
          }
          
          logger.error(
            `Error in operation ${options.operation}: ${errorMessage}`, 
            options.category
          );
          
          // Call custom error handler if provided
          if (options.onError && error instanceof Error) {
            options.onError(error);
          }
          
          // Handle AxeError objects directly
          if (error instanceof Error && 'code' in error) {
            if (!options.continueOnError) {
              throw error;
            }
            
            logger.debug(`Continuing after error: ${errorMessage}`, options.category);
            return undefined as unknown as T;
          }
          
          // Wrap other errors with better details
          const errorDetails: Record<string, unknown> = { 
            operation: options.operation
          };
          
          // Extract more details from the error
          if (error !== null && typeof error === 'object') {
            for (const key in error) {
              try {
                if (key !== 'stack' && key !== 'message') {
                  errorDetails[key] = error[key];
                }
              } catch {
                // Ignore property access errors
              }
            }
          }
          
          const axeError = createGeneratorError(
            options.errorCode || 9000,
            `Error in ${options.operation}: ${errorMessage}`,
            errorDetails,
            error instanceof Error ? error : new Error(errorMessage)
          );
          
          if (!options.continueOnError) {
            throw axeError;
          }
          
          logger.debug(`Continuing after wrapped error: ${errorMessage}`, options.category);
          return undefined as unknown as T;
        }
      },
      { args: args.length > 0 ? args : undefined }
    );
  };
}
