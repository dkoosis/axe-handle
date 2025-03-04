// Path: src/utils/resultUtils.ts
// Provides utilities for working with the Result pattern from neverthrow.

import { Result, ResultAsync, Ok, err, ok } from 'neverthrow';
import { AxeError } from '../types';
import { createGeneratorError } from './errorUtils';
import { logger, LogCategory } from './logger';

/**
 * Type alias for the Result type used in Axe Handle.
 */
export type AxeResult<T> = Result<T, AxeError>;

/**
 * Type alias for the ResultAsync type used in Axe Handle.
 */
export type AxeResultAsync<T> = ResultAsync<T, AxeError>;

/**
 * Creates an Ok result.
 * @param value The value to wrap in an Ok result
 * @returns An Ok result
 */
export function okResult<T>(value: T): AxeResult<T> {
  return ok(value);
}

/**
 * Creates an Err result from an AxeError.
 * @param error The AxeError to wrap in an Err result
 * @returns An Err result
 */
export function errResult<T>(error: AxeError): AxeResult<T> {
  return err(error);
}

/**
 * Creates an Err result from a generator error.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns An Err result
 */
export function createGeneratorErrorResult<T>(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeResult<T> {
  return err(createGeneratorError(code, message, details, cause));
}

/**
 * Wraps a synchronous operation in a try/catch and returns a Result.
 * @param operation The operation to run
 * @param operationName Optional name for the operation (for logging)
 * @param errorCode Error code to use for the AxeError
 * @param category Logging category
 * @returns A Result with the operation result or an AxeError
 */
export function runOperation<T>(
  operation: () => T, 
  operationName: string = 'unknown',
  errorCode: number = 9000,
  category: LogCategory = LogCategory.GENERAL
): AxeResult<T> {
  try {
    logger.debug(`Running operation: ${operationName}`, category);
    const result = operation();
    return ok(result);
  } catch (error) {
    logger.error(`Operation '${operationName}' failed: ${error}`, category);
    
    if (error instanceof Error && 'code' in error) {
      // It's already an AxeError
      return err(error as AxeError);
    }
    
    return err(createGeneratorError(
      errorCode,
      `Operation '${operationName}' failed: ${error instanceof Error ? error.message : String(error)}`,
      { operationName },
      error instanceof Error ? error : new Error(String(error))
    ));
  }
}

/**
 * Wraps an asynchronous operation in a try/catch and returns a ResultAsync.
 * @param operation The async operation to run
 * @param operationName Optional name for the operation (for logging)
 * @param errorCode Error code to use for the AxeError
 * @param category Logging category
 * @returns A ResultAsync with the operation result or an AxeError
 */
export function runAsyncOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'unknown',
  errorCode: number = 9000,
  category: LogCategory = LogCategory.GENERAL
): AxeResultAsync<T> {
  return ResultAsync.fromPromise(
    (async () => {
      logger.debug(`Running async operation: ${operationName}`, category);
      return await operation();
    })(),
    (error) => {
      logger.error(`Async operation '${operationName}' failed: ${error}`, category);
      
      if (error instanceof Error && 'code' in error) {
        // It's already an AxeError
        return error as AxeError;
      }
      
      return createGeneratorError(
        errorCode,
        `Async operation '${operationName}' failed: ${error instanceof Error ? error.message : String(error)}`,
        { operationName },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  );
}

/**
 * Combines multiple results into a single result containing an array of values.
 * If any result is an Err, the first Err is returned.
 * @param results The results to combine
 * @returns A combined result
 */
export function combineResults<T>(results: AxeResult<T>[]): AxeResult<T[]> {
  const values: T[] = [];
  
  for (const result of results) {
    if (result.isErr()) {
      return err(result.error);
    }
    values.push(result.value);
  }
  
  return ok(values);
}

/**
 * Combines multiple async results into a single async result containing an array of values.
 * If any result is an Err, the first Err is returned.
 * @param results The async results to combine
 * @returns A combined async result
 */
export function combineAsyncResults<T>(results: AxeResultAsync<T>[]): AxeResultAsync<T[]> {
  // Use Promise.all to wait for all results
  return ResultAsync.fromPromise(
    Promise.all(results.map(result => result.match(
      (value) => ({ status: 'ok' as const, value }),
      (error) => ({ status: 'err' as const, error })
    ))),
    (error) => createGeneratorError(
      9001,
      `Failed to combine async results: ${error instanceof Error ? error.message : String(error)}`,
      {},
      error instanceof Error ? error : new Error(String(error))
    )
  ).andThen((results) => {
    // Check for any errors
    const firstError = results.find(result => result.status === 'err');
    if (firstError && firstError.status === 'err') {
      return err(firstError.error);
    }
    
    // Extract values
    const values = results
      .filter((result): result is { status: 'ok', value: T } => result.status === 'ok')
      .map(result => result.value);
    
    return ok(values);
  });
}
