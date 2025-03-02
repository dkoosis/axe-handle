#!/usr/bin/env node
// Path: src/cli.ts
// Provides the command-line interface for the Axe Handle code generator.

import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { generateMcpServer } from './index';
import { AxeError, ErrorPrefix, AxeErrorCategory, GeneratorOptions } from './types';

// Create CLI program
const program = new Command();

/**
 * Formats an error message for CLI display.
 * @param error The error to format
 * @returns Formatted error message
 */
function formatError(error: Error | AxeError): string {
  if ('code' in error) {
    const axeError = error as AxeError;
    let message = `${chalk.red('ERROR')} ${chalk.yellow(axeError.code)}: ${axeError.message}`;
    
    if (axeError.details) {
      message += '\n\nDetails:';
      for (const [key, value] of Object.entries(axeError.details)) {
        message += `\n  ${chalk.cyan(key)}: ${value}`;
      }
    }
    
    if (axeError.cause) {
      message += `\n\nCaused by: ${formatError(axeError.cause)}`;
    }
    
    return message;
  } else {
    return chalk.red(`ERROR: ${error.message}`);
  }
}

/**
 * Creates an Axe Handle error.
 * @param category Error category
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createAxeError(
  category: AxeErrorCategory,
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return {
    code: `${ErrorPrefix.AXE}-${category}${String(code).padStart(3, '0')}`,
    message,
    details,
    cause,
  };
}

program
  .name('axe-handle')
  .description('Generate an MCP server from a Protobuf schema')
  .version('0.1.0');

program
  .argument('<schema>', 'Protobuf schema file (.proto) or OpenAPI specification (.yaml, .yml, .json)')
  .argument('<output-dir>', 'Output directory for generated code')
  .option('-c, --config <file>', 'Configuration file (JSON)')
  .option('-o, --overwrite', 'Overwrite existing files', false)
  .option('-d, --docs', 'Generate documentation', true)
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (schemaFile: string, outputDir: string, cmdOptions: any) => {
    try {
      // Validate input file
      const inputFile = path.resolve(process.cwd(), schemaFile);
      try {
        await fs.access(inputFile);
      } catch (error) {
        throw createAxeError(
          AxeErrorCategory.CLI,
          1,
          `Input file not found: ${schemaFile}`,
          { path: inputFile },
          error instanceof Error ? error : undefined
        );
      }
      
      // Validate output directory
      const outDir = path.resolve(process.cwd(), outputDir);
      try {
        await fs.mkdir(outDir, { recursive: true });
      } catch (error) {
        throw createAxeError(
          AxeErrorCategory.CLI,
          2,
          `Failed to create output directory: ${outputDir}`,
          { path: outDir },
          error instanceof Error ? error : undefined
        );
      }
      
      // Validate config file if provided
      let configFile: string | undefined = undefined;
      if (cmdOptions.config) {
        configFile = path.resolve(process.cwd(), cmdOptions.config);
        try {
          await fs.access(configFile);
        } catch (error) {
          throw createAxeError(
            AxeErrorCategory.CLI,
            3,
            `Configuration file not found: ${cmdOptions.config}`,
            { path: configFile },
            error instanceof Error ? error : undefined
          );
        }
      }
      
      // Create generator options
      const options: GeneratorOptions = {
        inputFile,
        outputDir: outDir,
        configFile,
        overwrite: cmdOptions.overwrite,
        generateDocs: cmdOptions.docs,
        verbose: cmdOptions.verbose
      };
      
      // Log options in verbose mode
      if (options.verbose) {
        console.log(chalk.cyan('Generator Options:'));
        console.log(chalk.cyan('  Input File:'), inputFile);
        console.log(chalk.cyan('  Output Directory:'), outDir);
        console.log(chalk.cyan('  Config File:'), configFile || 'None');
        console.log(chalk.cyan('  Overwrite:'), options.overwrite);
        console.log(chalk.cyan('  Generate Docs:'), options.generateDocs);
      }
      
      // Generate the MCP server
      console.log(chalk.green('Generating MCP server...'));
      await generateMcpServer(options);
      console.log(chalk.green('MCP server generated successfully!'));
      console.log(chalk.green(`Output directory: ${outDir}`));
      
    } catch (error) {
      // Improved error handling
      if (error instanceof Error) {
        console.error(formatError(error));
      } else {
        // For unknown error types
        console.error(chalk.red(`ERROR: ${JSON.stringify(error, null, 2)}`));
      }
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);
