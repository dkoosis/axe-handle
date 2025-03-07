// Path: src/utils/validationUtils.ts
/**
 * Utility service for validating inputs, paths, and ensuring data integrity
 * 
 * Provides methods for validating strings, files, directories, and interactive
 * confirmation for potentially destructive operations.
 */
import * as fs from 'fs';
import { createGeneratorError } from './errorUtils';
import { Result, ok, err } from 'neverthrow';
import readline from 'readline';
import * as path from 'path';

/**
 * Options for string validation
 */
interface StringValidationOptions {
  /** Minimum string length */
  minLength?: number;
  /** Maximum string length */
  maxLength?: number;
  /** Regular expression pattern to match */
  pattern?: RegExp;
  /** Whether to trim the input string before validation */
  trim?: boolean;
}

/**
 * Options for directory validation
 */
interface DirectoryValidationOptions {
  /** Custom error message */
  errorMessage?: string;
  /** Whether to create the directory if it doesn't exist */
  create?: boolean;
  /** Whether to validate that directory has write permissions */
  requireWritable?: boolean;
}

/**
 * Options for file system entity validation
 */
interface FileSystemValidationOptions {
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Options for overwrite validation
 */
interface OverwriteValidationOptions {
  /** Custom error message */
  errorMessage?: string;
  /** Whether to prompt for overwrite if directory is not empty */
  promptForOverwrite?: boolean;
  /** Default response for overwrite prompt if non-interactive */
  defaultOverwrite?: boolean;
}

/**
 * Validation utilities for inputs and path verification
 */
export class ValidationUtils {
  /**
   * Validates that a value is a properly formatted string
   * 
   * @param value String to validate
   * @param fieldName Field name for error messages
   * @param errorCode Error code for failures
   * @param options Validation options
   */
  public static validateString(
    value: unknown,
    fieldName: string,
    errorCode: number,
    options: StringValidationOptions = {}
  ): void {
    if (typeof value !== 'string') {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must be a string`,
        { fieldName, value, type: typeof value }
      );
    }

    const stringToValidate = options.trim ? value.trim() : value;

    if (options.minLength !== undefined && stringToValidate.length < options.minLength) {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must be at least ${options.minLength} characters`,
        { fieldName, value: stringToValidate, minLength: options.minLength }
      );
    }

    if (options.maxLength !== undefined && stringToValidate.length > options.maxLength) {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must be at most ${options.maxLength} characters`,
        { fieldName, value: stringToValidate, maxLength: options.maxLength }
      );
    }

    if (options.pattern !== undefined && !options.pattern.test(stringToValidate)) {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must match pattern ${options.pattern}`,
        { fieldName, value: stringToValidate, pattern: options.pattern.toString() }
      );
    }
  }

  /**
   * Validates that a file exists and is accessible
   * 
   * @param filePath File path to validate
   * @param errorCode Error code for failures
   * @param options Validation options
   * @returns Promise that resolves if valid, rejects if invalid
   */
  public static async validateFile(
    filePath: string,
    errorCode: number,
    options: FileSystemValidationOptions = {}
  ): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath);
      
      if (!stats.isFile()) {
        throw createGeneratorError(
          errorCode,
          options.errorMessage || `Path exists but is not a file: ${filePath}`,
          { filePath, isDirectory: stats.isDirectory() }
        );
      }
      
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch (error) {
      // Differentiate between "not exists" and "not readable"
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        throw createGeneratorError(
          errorCode,
          options.errorMessage || `File not found: ${filePath}`,
          { filePath },
          error
        );
      }
      
      throw createGeneratorError(
        errorCode,
        options.errorMessage || `File not accessible: ${filePath}`,
        { filePath },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validates that a directory exists and is accessible
   * 
   * @param dirPath Directory path to validate
   * @param errorCode Error code for failures
   * @param options Validation options
   * @returns Promise that resolves if valid, rejects if invalid
   */
  public static async validateDirectory(
    dirPath: string,
    errorCode: number,
    options: DirectoryValidationOptions = {}
  ): Promise<void> {
    try {
      const stats = await fs.promises.stat(dirPath);
      
      if (!stats.isDirectory()) {
        throw createGeneratorError(
          errorCode,
          options.errorMessage || `Path exists but is not a directory: ${dirPath}`,
          { dirPath, isFile: stats.isFile() }
        );
      }
      
      // Check read permission
      await fs.promises.access(dirPath, fs.constants.R_OK);
      
      // Check write permission if requested
      if (options.requireWritable) {
        await fs.promises.access(dirPath, fs.constants.W_OK);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        if (options.create) {
          try {
            await fs.promises.mkdir(dirPath, { recursive: true });
            return;
          } catch (mkdirError) {
            throw createGeneratorError(
              errorCode,
              options.errorMessage || `Failed to create directory: ${dirPath}`,
              { dirPath },
              mkdirError instanceof Error ? mkdirError : undefined
            );
          }
        }
        
        throw createGeneratorError(
          errorCode,
          options.errorMessage || `Directory not found: ${dirPath}`,
          { dirPath },
          error
        );
      }
      
      // Handle permission errors specifically
      if (error instanceof Error && 'code' in error && (error as any).code === 'EACCES') {
        throw createGeneratorError(
          errorCode,
          options.errorMessage || `Directory not accessible (permission denied): ${dirPath}`,
          { dirPath, permissionDenied: true },
          error
        );
      }
      
      throw createGeneratorError(
        errorCode,
        options.errorMessage || `Directory not accessible: ${dirPath}`,
        { dirPath },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validates a path exists and returns whether it's a file or directory
   * 
   * @param entityPath Path to validate
   * @param errorCode Error code for failures
   * @returns Promise that resolves with the entity type
   */
  public static async validatePathExists(
    entityPath: string,
    errorCode: number
  ): Promise<'file' | 'directory'> {
    try {
      const stats = await fs.promises.stat(entityPath);
      
      if (stats.isFile()) {
        return 'file';
      } else if (stats.isDirectory()) {
        return 'directory';
      } else {
        throw createGeneratorError(
          errorCode,
          `Path exists but is neither a file nor directory: ${entityPath}`,
          { entityPath, isSymlink: stats.isSymbolicLink() }
        );
      }
    } catch (error) {
      throw createGeneratorError(
        errorCode,
        `Path does not exist or is not accessible: ${entityPath}`,
        { entityPath },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Creates a readline interface for user input
   * @returns Readline interface for user interaction
   */
  private static createReadlineInterface(): readline.Interface {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Asks a yes/no question and returns the result
   * 
   * @param question The question to ask
   * @param defaultAnswer Default answer if user presses Enter
   * @returns Promise resolving to the user's answer
   */
  public static async askYesNoQuestion(
    question: string,
    defaultAnswer = false
  ): Promise<boolean> {
    const rl = this.createReadlineInterface();
    const defaultChoice = defaultAnswer ? 'Y/n' : 'y/N';
    
    return new Promise<boolean>((resolve) => {
      rl.question(`${question} (${defaultChoice}): `, (answer) => {
        rl.close();
        const normalizedAnswer = answer.trim().toLowerCase();
        
        if (normalizedAnswer === '') {
          return resolve(defaultAnswer);
        }
        
        return resolve(
          normalizedAnswer === 'y' || 
          normalizedAnswer === 'yes' || 
          normalizedAnswer === 'true'
        );
      });
    });
  }

  /**
   * Validates that a directory is empty or that overwrite is enabled
   * 
   * @param dirPath Directory path to validate
   * @param overwrite Whether overwrite is enabled
   * @param errorCode Error code for failures
   * @param options Validation options
   * @returns Promise that resolves if valid, rejects if invalid
   */
  public static async validateEmptyOrOverwrite(
    dirPath: string,
    overwrite: boolean,
    errorCode: number,
    options: OverwriteValidationOptions = {}
  ): Promise<void> {
    try {
      // Create directory if it doesn't exist yet
      if (!fs.existsSync(dirPath)) {
        await fs.promises.mkdir(dirPath, { recursive: true });
        return;
      }
      
      // Check if directory is empty
      const files = await fs.promises.readdir(dirPath);
      if (files.length === 0) {
        return; // Directory is empty, no validation needed
      }
      
      // Directory is not empty - check if we can overwrite
      if (overwrite) {
        return; // Overwrite is enabled, proceed
      }
      
      // No automatic overwrite, check if we should prompt
      if (options.promptForOverwrite) {
        const shouldOverwrite = await this.askYesNoQuestion(
          `Directory is not empty: ${dirPath}. Do you want to overwrite existing files?`,
          options.defaultOverwrite || false
        );
        
        if (shouldOverwrite) {
          return; // User confirmed overwrite
        }
      }
      
      // Neither automatic nor user-confirmed overwrite
      throw createGeneratorError(
        errorCode,
        options.errorMessage || `Directory is not empty and overwrite is not enabled: ${dirPath}`,
        { dirPath, overwrite, fileCount: files.length }
      );
    } catch (error) {
      // Pass through if it's already an AxeError
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw createGeneratorError(
        errorCode,
        options.errorMessage || `Failed to validate directory: ${dirPath}`,
        { dirPath },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validates that a path is within a specific base directory (prevents directory traversal)
   * 
   * @param basePath Base directory path
   * @param targetPath Target path to validate
   * @param errorCode Error code for failures
   * @returns Result indicating if the path is valid
   */
  public static validatePathWithinBase(
    basePath: string,
    targetPath: string, 
    errorCode: number
  ): Result<void, Error> {
    // Normalize paths to absolute paths
    const normalizedBasePath = path.resolve(basePath);
    const normalizedTargetPath = path.resolve(targetPath);
    
    // Check if target path starts with base path
    if (!normalizedTargetPath.startsWith(normalizedBasePath)) {
      return err(createGeneratorError(
        errorCode,
        `Path traversal detected: ${targetPath} is outside of ${basePath}`,
        { basePath, targetPath, 
          normalizedBasePath, 
          normalizedTargetPath }
      ));
    }
    
    return ok(undefined);
  }

  /**
   * Validates a filename against security rules
   * 
   * @param filename Filename to validate
   * @param errorCode Error code for failures 
   * @returns Result indicating if the filename is valid
   */
  public static validateFilename(
    filename: string,
    errorCode: number
  ): Result<void, Error> {
    // Check for path traversal attempts
    if (filename.includes('../') || filename.includes('..\\')) {
      return err(createGeneratorError(
        errorCode,
        `Invalid filename: ${filename} contains path traversal characters`,
        { filename }
      ));
    }
    
    // Check for absolute paths
    if (path.isAbsolute(filename)) {
      return err(createGeneratorError(
        errorCode,
        `Invalid filename: ${filename} is an absolute path`,
        { filename }
      ));
    }
    
    // Check for invalid characters
    const invalidCharsRegex = /[<>:"|?*\x00-\x1F]/;
    if (invalidCharsRegex.test(filename)) {
      return err(createGeneratorError(
        errorCode,
        `Invalid filename: ${filename} contains invalid characters`,
        { filename }
      ));
    }
    
    return ok(undefined);
  }
}
