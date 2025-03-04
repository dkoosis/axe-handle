// Path: src/utils/validationUtils.ts
import * as fs from 'fs';
import { createGeneratorError } from './errorUtils';
import readline from 'readline';

/**
 * Utility class for validating inputs and paths
 */
export class ValidationUtils {
  /**
   * Validates that a string meets certain criteria
   * @param value String to validate
   * @param fieldName Field name for error messages
   * @param errorCode Error code for failures
   * @param options Validation options
   */
  public static validateString(
    value: any,
    fieldName: string,
    errorCode: number,
    options: { minLength?: number; maxLength?: number; pattern?: RegExp } = {}
  ): void {
    if (typeof value !== 'string') {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must be a string`,
        { fieldName, value, type: typeof value }
      );
    }

    if (options.minLength !== undefined && value.length < options.minLength) {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must be at least ${options.minLength} characters`,
        { fieldName, value, minLength: options.minLength }
      );
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must be at most ${options.maxLength} characters`,
        { fieldName, value, maxLength: options.maxLength }
      );
    }

    if (options.pattern !== undefined && !options.pattern.test(value)) {
      throw createGeneratorError(
        errorCode,
        `${fieldName} must match pattern ${options.pattern}`,
        { fieldName, value, pattern: options.pattern.toString() }
      );
    }
  }

  /**
   * Validates that a file exists and is accessible
   * @param filePath File path to validate
   * @param errorCode Error code for failures
   * @param errorMessage Custom error message
   */
  public static async validateFile(
    filePath: string,
    errorCode: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch (error) {
      throw createGeneratorError(
        errorCode,
        errorMessage || `File not found or not readable: ${filePath}`,
        { filePath },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validates that a directory exists and is accessible
   * @param dirPath Directory path to validate
   * @param errorCode Error code for failures
   * @param errorMessage Custom error message
   * @param create Whether to create the directory if it doesn't exist
   */
  public static async validateDirectory(
    dirPath: string,
    errorCode: number,
    errorMessage?: string,
    create = false
  ): Promise<void> {
    try {
      await fs.promises.access(dirPath, fs.constants.R_OK);
    } catch (error) {
      if (create) {
        try {
          await fs.promises.mkdir(dirPath, { recursive: true });
          return;
        } catch (mkdirError) {
          throw createGeneratorError(
            errorCode,
            errorMessage || `Failed to create directory: ${dirPath}`,
            { dirPath },
            mkdirError instanceof Error ? mkdirError : undefined
          );
        }
      }

      throw createGeneratorError(
        errorCode,
        errorMessage || `Directory not found or not accessible: ${dirPath}`,
        { dirPath },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Creates a readline interface for user input
   */
  private static createReadlineInterface(): readline.Interface {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Asks a yes/no question
   * @param question The question to ask
   * @returns True if the answer is yes, false otherwise
   */
  private static async askYesNoQuestion(question: string): Promise<boolean> {
    const rl = this.createReadlineInterface();
    
    return new Promise<boolean>((resolve) => {
      rl.question(`${question} (y/n): `, (answer) => {
        rl.close();
        const normalizedAnswer = answer.trim().toLowerCase();
        resolve(normalizedAnswer === 'y' || normalizedAnswer === 'yes');
      });
    });
  }

  /**
   * Validates that a directory is empty or that overwrite is enabled
   * @param dirPath Directory path to validate
   * @param overwrite Whether overwrite is enabled
   * @param errorCode Error code for failures
   * @param errorMessage Custom error message
   * @param promptForOverwrite Whether to prompt for overwrite if directory is not empty
   */
  public static async validateEmptyOrOverwrite(
    dirPath: string,
    overwrite: boolean,
    errorCode: number,
    errorMessage?: string,
    promptForOverwrite = false
  ): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath);
      if (files.length > 0 && !overwrite) {
        if (promptForOverwrite) {
          const shouldOverwrite = await this.askYesNoQuestion(
            `Directory is not empty: ${dirPath}. Do you want to overwrite existing files?`
          );
          
          if (shouldOverwrite) {
            return; // User confirmed overwrite
          }
        }
        
        throw createGeneratorError(
          errorCode,
          errorMessage || `Directory is not empty and overwrite is not enabled: ${dirPath}`,
          { dirPath, overwrite, fileCount: files.length }
        );
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        // Directory doesn't exist yet, that's fine
        return;
      }
      throw error;
    }
  }
}
