// Path: src/templateProcessor/templateTypes.ts
// Type definitions for the template system

import { Result } from 'neverthrow';
import { TemplateError } from './templateError';

/**
 * Result type for template operations
 */
export type TemplateResult<T> = Result<T, TemplateError>;

/**
 * Template system configuration options
 */
export interface TemplateSystemOptions {
  /** Base directory for templates */
  baseDir: string;
  /** Whether to cache templates (default: true) */
  cache?: boolean;
  /** Whether to enable verbose logging (default: false) */
  verbose?: boolean;
  /** Custom helper functions */
  helpers?: Record<string, Function>;
}

/**
 * Template file with content and metadata
 */
export interface Template {
  /** Template name/path */
  name: string;
  /** Absolute path to the template file */
  absolutePath: string;
  /** Template content */
  content: string;
}