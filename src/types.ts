// Path: src/types.ts
// Common types used throughout the application

/**
 * Options for the generator
 */
export interface GeneratorOptions {
  /** Input file path (Protocol Buffer schema) */
  inputFile: string;
  /** Output directory for generated code */
  outputDir: string;
  /** Optional configuration file path */
  configFile?: string;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** Whether to enable interactive mode */
  interactive?: boolean;
  /** Whether to generate documentation */
  generateDocs?: boolean;
  /** Whether to enable verbose logging */
  verbose?: boolean;
}

/**
 * Standard error type for the application
 */
export interface AxeError extends Error {
  /** Error code for categorization */
  code: number | string;
  /** Detailed information about the error */
  details?: Record<string, unknown>;
  /** Original error that caused this error */
  cause?: Error | AxeError;
}

/**
 * Creates an AxeError with the given properties
 */
export function createAxeError(
  code: number | string,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error
): AxeError {
  const error = new Error(message) as AxeError;
  error.code = code;
  error.details = details;
  error.cause = cause;
  return error;
}
