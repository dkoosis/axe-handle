#!/usr/bin/env node
// Path: src/cli.ts
// Provides the command-line interface for the Axe Handle code generator.

import { Command } from 'commander';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { generateMcpServer } from './index';
import { AxeError, GeneratorOptions } from './types';
import { logger } from './utils/logger';

// Create CLI program
const program = new Command();

/**
 * Formats an error message for CLI display.
 * @param error The error to format
 * @returns Formatted error message string
 */
function formatError(error: Error | AxeError): string {
  if ('code' in error) {
    const axeError = error as AxeError;
    let message = `${chalk.red(axeError.code)}: ${axeError.message}`;

    if (axeError.details && Object.keys(axeError.details).length > 0) {
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
    return error.message;
  }
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
  .option('-v, --verbose', 'Verbose output with detailed logs', false)
  .option('--no-color', 'Disable colored output')
  .action(async (schemaFile: string, outputDir: string, cmdOptions: any) => {
    try {
      // Configure logger based on CLI options
      logger.updateConfig({
        verbose: cmdOptions.verbose,
        colors: cmdOptions.color !== false
      });
      
      logger.section('Axe Handle MCP Server Generator');
      
      // Validate input file
      const inputFile = path.resolve(process.cwd(), schemaFile);
      try {
        await fs.access(inputFile);
        logger.info(`Schema file: ${inputFile}`);
      } catch (error) {
        logger.error(`Input file not found: ${schemaFile}`);
        process.exit(1);
      }

      // Validate output directory
      const outDir = path.resolve(process.cwd(), outputDir);
      try {
        await fs.mkdir(outDir, { recursive: true });
        logger.info(`Output directory: ${outDir}`);
      } catch (error) {
        logger.error(`Failed to create output directory: ${outputDir}`);
        process.exit(1);
      }

      // Validate config file if provided
      let configFile: string | undefined = undefined;
      if (cmdOptions.config) {
        configFile = path.resolve(process.cwd(), cmdOptions.config);
        try {
          await fs.access(configFile);
          logger.info(`Config file: ${configFile}`);
        } catch (error) {
          logger.error(`Configuration file not found: ${cmdOptions.config}`);
          process.exit(1);
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
      logger.debug(`Generator Options: ${JSON.stringify({
        overwrite: options.overwrite,
        generateDocs: options.generateDocs,
        verbose: options.verbose
      }, null, 2)}`);

      // Generate the MCP server
      logger.section('Generating MCP Server');
      
      await generateMcpServer(options);
      
      logger.section('Generation Complete');
      logger.success(`MCP server generated successfully!`);
      logger.summary(`Output directory: ${outDir}`);
      
      if (options.generateDocs) {
        const docsPath = path.join(outDir, 'docs', 'api.md');
        logger.info(`API documentation: ${docsPath}`);
      }
      
      logger.info('\nNext steps:');
      logger.info(`  cd ${outputDir}`);
      logger.info('  npm install');
      logger.info('  npm run dev');

    } catch (error) {
      logger.section('Generation Failed');
      
      if (error instanceof Error) {
        logger.error(formatError(error));
        
        if ('code' in error && (error as any).details) {
          const details = (error as any).details;
          logger.debug(`Error details: ${JSON.stringify(details, null, 2)}`);
        }
      } else {
        logger.error(`Unknown error: ${JSON.stringify(error, null, 2)}`);
      }
      
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);
