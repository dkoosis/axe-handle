import path from 'path';
import fs from 'fs/promises';
import { Result, ResultAsync, err, ok } from 'neverthrow';
import { AppError, ErrorType, createError } from './errors';

/**
 * Standard file header template for the project
 */
export const generateFileHeader = (
  filePath: string,
  options: {
    author?: string;
    description?: string;
    copyright?: string;
    license?: string;
  } = {}
): string => {
  const {
    author = 'Axe Handle Team',
    description = '',
    copyright = `Copyright (c) ${new Date().getFullYear()} Axe Handle Project`,
    license = 'ISC',
  } = options;

  const normalizedPath = normalizeFilePath(filePath);
  const timestamp = new Date().toISOString();

  return `/**
 * @file ${normalizedPath}
 * @description ${description}
 * @author ${author}
 * @created ${timestamp}
 * @copyright ${copyright}
 * @license ${license}
 */

`;
};

/**
 * Normalizes a file path for consistent use in file headers
 */
export const normalizeFilePath = (filePath: string): string => {
  // Convert backslashes to forward slashes and ensure project-relative path
  const normalized = filePath.replace(/\\/g, '/');
  
  // Remove any leading './' or '/'
  return normalized.replace(/^\.\/|^\//g, '');
};

/**
 * Validates if a file has the proper header
 */
export const validateFileHeader = (
  fileContent: string,
  expectedPath: string
): Result<boolean, AppError> => {
  const normalizedPath = normalizeFilePath(expectedPath);
  
  // Check if the file content contains the expected path in a header comment
  const headerRegex = new RegExp(`@file\\s+${normalizedPath.replace(/\//g, '\\/')}`, 'i');
  
  if (!headerRegex.test(fileContent)) {
    return err(
      createError(
        ErrorType.VALIDATION,
        `File header validation failed: Missing or incorrect @file path (expected: ${normalizedPath})`,
        { expectedPath: normalizedPath }
      )
    );
  }
  
  return ok(true);
};

/**
 * Checks if a specific file has proper header
 */
export const checkFileHeader = async (
  filePath: string
): Promise<ResultAsync<boolean, AppError>> => {
  return ResultAsync.fromPromise(
    fs.readFile(filePath, 'utf-8'),
    (error) => createError(
      ErrorType.INTERNAL,
      `Failed to read file for header validation: ${String(error)}`
    )
  ).andThen((content) => validateFileHeader(content, filePath));
};

/**
 * Updates a file header or adds it if missing
 */
export const ensureFileHeader = async (
  filePath: string,
  options: {
    author?: string;
    description?: string;
    force?: boolean;
  } = {}
): Promise<ResultAsync<void, AppError>> => {
  const { force = false } = options;

  return ResultAsync.fromPromise(
    fs.readFile(filePath, 'utf-8'),
    (error) => createError(
      ErrorType.INTERNAL,
      `Failed to read file for header update: ${String(error)}`
    )
  )
    .andThen((content) => {
      const checkResult = validateFileHeader(content, filePath);
      
      // If header is valid and we're not forcing update, do nothing
      if (checkResult.isOk() && !force) {
        return ResultAsync.fromPromise(
          Promise.resolve(),
          () => createError(ErrorType.INTERNAL, 'Unexpected error in header validation')
        );
      }
      
      // Generate new header
      const newHeader = generateFileHeader(filePath, options);
      
      // If file already has a header comment, replace it
      const headerPattern = /\/\*\*[\s\S]*?\*\/\s*\n\s*\n/;
      const newContent = headerPattern.test(content)
        ? content.replace(headerPattern, newHeader)
        : newHeader + content;
      
      return ResultAsync.fromPromise(
        fs.writeFile(filePath, newContent, 'utf-8'),
        (error) => createError(
          ErrorType.INTERNAL,
          `Failed to write updated header: ${String(error)}`
        )
      );
    });
};

/**
 * Recursively validates all files in a directory match header standards
 */
export const validateAllFileHeaders = async (
  directory: string,
  options: {
    extensions?: string[];
    exclude?: string[];
  } = {}
): Promise<ResultAsync<{valid: string[], invalid: string[]}, AppError>> => {
  const { extensions = ['.ts', '.js', '.tsx', '.jsx'], exclude = ['node_modules', 'dist'] } = options;
  
  const valid: string[] = [];
  const invalid: string[] = [];
  
  const processDirectory = async (dir: string): Promise<void> => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip excluded directories
        if (entry.isDirectory() && exclude.includes(entry.name)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
          const result = await checkFileHeader(fullPath);
          
          if (result.isOk()) {
            valid.push(fullPath);
          } else {
            invalid.push(fullPath);
          }
        }
      }
    } catch (error) {
      throw createError(
        ErrorType.INTERNAL,
        `Error processing directory: ${String(error)}`
      );
    }
  };
  
  return ResultAsync.fromPromise(
    processDirectory(directory).then(() => ({ valid, invalid })),
    (error) => {
      if (isAppError(error)) return error;
      return createError(
        ErrorType.INTERNAL,
        `Failed to validate file headers: ${String(error)}`
      );
    }
  );
};

// Helper to check if an error is our AppError type
const isAppError = (error: unknown): error is AppError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
};