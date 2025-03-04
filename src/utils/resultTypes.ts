// src/utils/resultTypes.ts
import { Result, ok, err } from 'neverthrow';

// Base error class with enhanced details
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.cause = cause;
    this.name = this.constructor.name;
  }
}

// Template-specific errors
export class TemplateError extends AppError {
  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(code, message, details, cause);
  }
}

export class TemplateNotFoundError extends TemplateError {
  constructor(templateName: string, cause?: Error) {
    super(
      'AXE-3003',
      `Template not found: ${templateName}`,
      { templateName },
      cause
    );
  }
}

export class TemplateRenderError extends TemplateError {
  constructor(templateName: string, missingVars: string[], cause?: Error) {
    super(
      'AXE-3004',
      `Failed to render template: ${templateName}`,
      { templateName, missingVars },
      cause
    );
  }
}

// Utility functions
export function fromPromise<T, E extends Error>(
  promise: Promise<T>,
  errorFn: (error: unknown) => E
): Promise<Result<T, E>> {
  return promise
    .then(ok)
    .catch(error => err(errorFn(error)));
}

export function tryCatch<T, E extends Error>(
  fn: () => T,
  errorFn: (error: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(errorFn(error));
  }
}

// Re-export neverthrow
export { Result, ok, err };