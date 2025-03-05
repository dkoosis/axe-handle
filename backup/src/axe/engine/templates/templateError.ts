// Path: src/utils/templates/templateError.ts
// Error types for the template system

/**
 * Base error class for template system errors
 */
export class TemplateError extends Error {
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

/**
 * Error thrown when a template cannot be found
 */
export class TemplateNotFoundError extends TemplateError {
  constructor(
    templateName: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      'AXE-3003',
      `Template not found: ${templateName}`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when template rendering fails
 */
export class TemplateRenderError extends TemplateError {
  constructor(
    templateName: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      'AXE-3005',
      `Failed to render template: ${templateName}`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when template initialization fails
 */
export class TemplateInitializationError extends TemplateError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      'AXE-3001',
      message,
      details,
      cause
    );
  }
}

/**
 * Error thrown when template loading fails
 */
export class TemplateLoadError extends TemplateError {
  constructor(
    templateName: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      'AXE-3004',
      `Failed to load template: ${templateName}`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when writing template output fails
 */
export class TemplateWriteError extends TemplateError {
  constructor(
    templateName: string,
    outputPath: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      'AXE-3006',
      `Failed to write template output to file: ${outputPath}`,
      { templateName, outputPath, ...details },
      cause
    );
  }
}
