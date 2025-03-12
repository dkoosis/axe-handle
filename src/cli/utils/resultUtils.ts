// Path: src/cli/utils/resultUtils.ts
/**
 * @file src/cli/utils/resultUtils.ts
 * @description Utility functions for handling Results and error handling
 * @author Axe Handle Team
 * @created 2025-03-12
 * @copyright Copyright (c) 2025 Axe Handle Project
 * @license ISC
 */

import { Result, ok, err } from 'neverthrow';
import { AppError, ErrorType, createError } from '../../utils/errors';

// Define the AxeResult type for consistency across the application
export type AxeResult<T> = {
  success: boolean;
  data?: T;
  error?: AppError;
};

/**
 * Creates a generator error with consistent formatting
 */
export function createGeneratorError(
  errorCode: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): Error {
  const error = new Error(message);
  (error as any).code = errorCode;
  (error as any).details = details || {};
  
  if (cause) {
    (error as any).cause = cause;
  }
  
  return error;
}

/**
 * Runs an async operation and wraps it in a Result
 */
export async function runAsyncOperation<T>(
  operation: () => Promise<T>,
  errorCategory = 'OPERATION_ERROR'
): Promise<Result<T, AppError>> {
  try {
    const result = await operation();
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(createError(ErrorType.INTERNAL, `${errorCategory}: ${message}`));
  }
}

/**
 * Runs a synchronous operation and wraps it in a Result
 */
export function runOperation<T>(
  operation: () => T,
  errorCategory = 'OPERATION_ERROR'
): Result<T, AppError> {
  try {
    const result = operation();
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(createError(ErrorType.INTERNAL, `${errorCategory}: ${message}`));
  }
}
