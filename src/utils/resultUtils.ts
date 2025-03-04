// src/utils/resultUtils.ts - Fix the fromPromise error and other type issues

import { Result, ResultAsync, Ok, Err, err, ok } from 'neverthrow';
import { AxeError } from '../types';
import { createGeneratorError } from './errorUtils';

// Type definitions for our Result types
export type AxeResult<T> = Result<T, AxeError>;
export type AxeResultAsync<T> = ResultAsync<T, AxeError>;

/**
 * Creates a successful result
 */
export function okResult<T>(value: T): AxeResult<T> {
  return ok(value);
}

/**
 * Creates an error result
 */
export function errResult<T>(error: AxeError): AxeResult<T> {
  return err(error);
}

/**
 * Creates a generator error result
 */
export function createGeneratorErrorResult<T>(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeResult<T> {
  return errResult<T>(createGeneratorError(code, message, details, cause));
}

/**
 * Wraps a function with error handling that returns a Result
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => T,
  errorCreator: (message: string, details?: Record<string, unknown>, cause?: Error) => AxeError
): (...args: Args) => AxeResult<T> {
  return (...args: Args): AxeResult<T> => {
    try {
      return okResult(fn(...args));
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, return it
        return errResult<T>(error as AxeError);
      }
      
      // Wrap the error in an AxeError
      const errorMessage = error instanceof Error ? error.message : String(error);
      return errResult<T>(
        errorCreator(
          errorMessage,
          { function: fn.name },
          error instanceof Error ? error : new Error(errorMessage)
        )
      );
    }
  };
}

/**
 * Wraps a function with error handling that returns a ResultAsync
 */
export function withAsyncErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  errorCreator: (message: string, details?: Record<string, unknown>, cause?: Error) => AxeError
): (...args: Args) => AxeResultAsync<T> {
  return (...args: Args): AxeResultAsync<T> => {
    try {
      // Fix: Add proper errorFn as second argument to fromPromise
      return ResultAsync.fromPromise(
        fn(...args),
        (e: unknown) => {
          const errorMessage = e instanceof Error ? e.message : String(e);
          return errorCreator(
            errorMessage,
            { function: fn.name },
            e instanceof Error ? e : new Error(errorMessage)
          );
        }
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, return it
        return ResultAsync.fromPromise(
          Promise.reject(error),
          () => error as AxeError
        );
      }
      
      // Wrap the error in an AxeError
      const errorMessage = error instanceof Error ? error.message : String(error);
      const axeError = errorCreator(
        errorMessage,
        { function: fn.name },
        error instanceof Error ? error : new Error(errorMessage)
      );
      return ResultAsync.fromPromise(
        Promise.reject(axeError),
        () => axeError
      );
    }
  };
}

/**
 * Runs an operation and returns a Result
 */
export function runOperation<T>(
  fn: () => T,
  operation: string,
  category?: string,
  errorCode: number = 9000
): AxeResult<T> {
  return withErrorHandling(
    fn,
    (message, details, cause) => createGeneratorError(
      errorCode,
      `Error in ${operation}: ${message}`,
      { operation, category, ...details },
      cause
    )
  )();
}

/**
 * Runs an async operation and returns a ResultAsync
 */
export function runAsyncOperation<T>(
  fn: () => Promise<T>,
  operation: string,
  category?: string,
  errorCode: number = 9000
): AxeResultAsync<T> {
  return withAsyncErrorHandling(
    fn,
    (message, details, cause) => createGeneratorError(
      errorCode,
      `Error in ${operation}: ${message}`,
      { operation, category, ...details },
      cause
    )
  )();
}

/**
 * Extracts the value from a Result or throws the error
 */
export function extractOrThrow<T>(result: AxeResult<T>): T {
  if (result.isOk()) {
    return result.value;
  } else {
    throw result.error;
  }
}

/**
 * Extracts the value from a ResultAsync or throws the error
 */
export async function extractAsyncOrThrow<T>(resultAsync: AxeResultAsync<T>): Promise<T> {
  // Fix: use .match to handle both Ok and Err cases
  return resultAsync.match(
    (value: T) => Promise.resolve(value),
    (error: AxeError) => Promise.reject(error)
  );
}

/**
 * Combines multiple Results into a single Result
 */
export function combineResults<T extends any[]>(...results: { [K in keyof T]: AxeResult<T[K]> }): AxeResult<T> {
  for (const result of results) {
    if (result.isErr()) {
      return errResult(result.error);
    }
  }
  
  // All results are Ok, combine their values
  return okResult(results.map(r => (r as Ok<any, AxeError>).value) as T);
}
