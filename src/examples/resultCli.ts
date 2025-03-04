// Path: src/examples/resultCli.ts
// Example CLI implementation using the Result pattern

import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { generateMcpServerResult, GeneratorOptions, AxeResult } from '../index';
import { logger, LogLevel } from '../utils/logger';

/**
 * Formats an error for CLI display.
 */
function formatError(error: any): string {
  if (error && 'code' in error) {
    const axeError = error;
    let message = `${chalk.red(axeError.code)}: ${axeError.message}`;

    if (axeError.details && Object.keys(axeError.details).length > 0) {
      message += '\n\nDetails:';
      for (const [key, value] of Object.entries(axeError.details)) {
        message += `\n  ${chalk.cyan(key)}: ${value}`;
      }
    }

    if (axeError.cause) {
      message += `\n\nCaused by: ${axeError.cause instanceof Error ? axeError.cause.message : String(axeError.cause)}`;
    }

    return message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return String(error);
  }
}

// Create CLI program
const program = new Command();

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
    try {
      // Configure logger based on CLI options
      logger.updateConfig({
        level: cmdOptions.verbose ? LogLevel.DEBUG : LogLevel.INFO,
        colors: cmdOptions.color !== false
      });
      
      // Create generator options
      const options: GeneratorOptions = {
        inputFile: path.resolve(process.cwd(), schemaFile),
        outputDir: path.resolve(process.cwd(), outputDir),
        configFile: cmdOptions.config ? path.resolve(process.cwd(), cmdOptions.config) : undefined,
        overwrite: cmdOptions.overwrite,
        generateDocs: cmdOptions.docs,
        verbose: cmdOptions.verbose
      };

      // Generate the MCP server using Result pattern
      const result = await generateMcpServerResult(options);
      
      result.match(
        () => {
          console.log(chalk.green('✓ MCP server generated successfully!'));
          console.log(`Output directory: ${outputDir}`);
          console.log('\nNext steps:');
          console.log(`  cd ${outputDir}`);
          console.log('  npm install');
          console.log('  npm run dev');
        },
        (error) => {
          console.error(chalk.red('✗ Generation failed:'));
          console.error(formatError(error));
          process.exit(1);
        }
      );
    } catch (error) {
      console.error(chalk.red('✗ Unexpected error:'));
      console.error(formatError(error));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);
