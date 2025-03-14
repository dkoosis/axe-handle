// Path: src/axe/schema/types.ts
// Type definitions for schema handling

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
