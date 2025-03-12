// Path: src/cli/types.ts
// Type definitions for the CLI

/**
 * Generator options for the CLI
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
