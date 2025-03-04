// Path: src/examples/resultCli.ts
// Example CLI that demonstrates the Result pattern for error handling.

import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { generateMcpServerResult, AxeResult, GeneratorOptions } from '../index';
import { LogLevel, logger } from '../utils/logger';
import { AxeError } from '../types';

// Create CLI program
const program = new Command();

/**
 * Formats an error message for CLI display.
 * @param error The AxeError to format
 * @returns Formatted error message string
 */
function formatError(error: AxeError): string {
  let message = `${chalk.red(error.code)}: ${error.message}`;

  if (error.details && Object.keys(error.details).length > 0) {
    message += '\n\nDetails:';
    for (const [key, value] of Object.entries(error.details)) {
      message += `\n  ${chalk.cyan(key)}: ${value}`;
    }
  }

  if (error.cause && error.cause instanceof Error) {
    if ('code' in error.cause) {
      message += `\n\nCaused by: ${formatError(error.cause as AxeError)}`;
    } else {
      message += `\n\nCaused by: ${error.cause.message}`;
    }
  }

  return message;
}

program
  .name('axe-handle-result')
  .description('Generate an MCP server from a Protobuf schema using Result pattern')
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
    // Configure logger based on CLI options
    logger.updateConfig({
      level: cmdOptions.verbose ? LogLevel.DEBUG : LogLevel.INFO,
      colors: cmdOptions.color !== false
    });
    
    logger.section('Axe Handle MCP Server Generator (Result Version)');
    
    // Resolve file paths
    const inputFile = path.resolve(process.cwd(), schemaFile);
    const outDir = path.resolve(process.cwd(), outputDir);
    let configFile: string | undefined = undefined;
    
    if (cmdOptions.config) {
      configFile = path.resolve(process.cwd(), cmdOptions.config);
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
    if (cmdOptions.verbose) {
      logger.debug(`Generator Options: ${JSON.stringify(options, null, 2)}`);
    }
    
    // Generate the MCP server using the Result pattern
    const result = await generateMcpServerResult(options);
    
    // Handle the result
    result.match(
      // Success case
      () => {
        logger.section('Generation Complete');
        logger.info(`MCP server generated successfully!`);
        logger.info(`Output directory: ${outDir}`);
        
        if (options.generateDocs) {
          const docsPath = path.join(outDir, 'docs', 'api.md');
          logger.info(`API documentation: ${docsPath}`);
        }
        
        logger.info('\nNext steps:');
        logger.info(`  cd ${outputDir}`);
        logger.info('  npm install');
        logger.info('  npm run dev');
      },
      // Error case
      (error) => {
        logger.section('Generation Failed');
        logger.error(formatError(error));
        
        if ('details' in error) {
          logger.debug(`Error details: ${JSON.stringify(error.details, null, 2)}`);
        }
        
        process.exit(1);
      }
    );
  });

// Parse command line arguments
program.parse(process.argv);
