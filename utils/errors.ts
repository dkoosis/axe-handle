import { Result, ResultAsync, err, ok } from 'neverthrow';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL = 'INTERNAL',
}

export interface AppError {
  type: ErrorType;
  message: string;
  metadata?: Record<string, unknown>;
}

export const createError = (
  type: ErrorType,
  message: string,
  metadata?: Record<string, unknown>,
): AppError => ({
  type,
  message,
  metadata,
});

export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  errorType: ErrorType = ErrorType.INTERNAL,
): Promise<Result<T, AppError>> => {
  try {
    const result = await fn();
    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return err(createError(errorType, message));
  }
};

export const asyncResultHandler = <T, E extends AppError>(
  asyncResult: ResultAsync<T, E>,
  onSuccess: (data: T) => void,
  onError: (error: E) => void,
): void => {
  asyncResult
    .map((data) => {
      onSuccess(data);
      return data;
    })
    .mapErr((error) => {
      onError(error);
      return error;
    });
};

export const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    Object.values(ErrorType).includes((error as AppError).type)
  );
};