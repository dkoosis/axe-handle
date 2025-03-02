#!/usr/bin/env node
"use strict";
// Path: src/cli.ts
// Provides the command-line interface for the Axe Handle code generator.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const chalk_1 = __importDefault(require("chalk"));
const index_1 = require("./index");
const types_1 = require("./types");
// Create CLI program
const program = new commander_1.Command();
/**
 * Formats an error message for CLI display.
 * @param error The error to format
 * @returns Formatted error message
 */
function formatError(error) {
    if ('code' in error) {
        const axeError = error;
        let message = `${chalk_1.default.red('ERROR')} ${chalk_1.default.yellow(axeError.code)}: ${axeError.message}`;
        if (axeError.details) {
            message += '\n\nDetails:';
            for (const [key, value] of Object.entries(axeError.details)) {
                message += `\n  ${chalk_1.default.cyan(key)}: ${value}`;
            }
        }
        if (axeError.cause) {
            message += `\n\nCaused by: ${formatError(axeError.cause)}`;
        }
        return message;
    }
    else {
        return chalk_1.default.red(`ERROR: ${error.message}`);
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
function createAxeError(category, code, message, details, cause) {
    return {
        code: `${types_1.ErrorPrefix.AXE}-${category}${String(code).padStart(3, '0')}`,
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
    .action(async (schemaFile, outputDir, cmdOptions) => {
    try {
        // Validate input file
        const inputFile = path_1.default.resolve(process.cwd(), schemaFile);
        try {
            await promises_1.default.access(inputFile);
        }
        catch (error) {
            throw createAxeError(types_1.AxeErrorCategory.CLI, 1, `Input file not found: ${schemaFile}`, { path: inputFile }, error instanceof Error ? error : undefined);
        }
        // Validate output directory
        const outDir = path_1.default.resolve(process.cwd(), outputDir);
        try {
            await promises_1.default.mkdir(outDir, { recursive: true });
        }
        catch (error) {
            throw createAxeError(types_1.AxeErrorCategory.CLI, 2, `Failed to create output directory: ${outputDir}`, { path: outDir }, error instanceof Error ? error : undefined);
        }
        // Validate config file if provided
        let configFile = undefined;
        if (cmdOptions.config) {
            configFile = path_1.default.resolve(process.cwd(), cmdOptions.config);
            try {
                await promises_1.default.access(configFile);
            }
            catch (error) {
                throw createAxeError(types_1.AxeErrorCategory.CLI, 3, `Configuration file not found: ${cmdOptions.config}`, { path: configFile }, error instanceof Error ? error : undefined);
            }
        }
        // Create generator options
        const options = {
            inputFile,
            outputDir: outDir,
            configFile,
            overwrite: cmdOptions.overwrite,
            generateDocs: cmdOptions.docs,
            verbose: cmdOptions.verbose
        };
        // Log options in verbose mode
        if (options.verbose) {
            console.log(chalk_1.default.cyan('Generator Options:'));
            console.log(chalk_1.default.cyan('  Input File:'), inputFile);
            console.log(chalk_1.default.cyan('  Output Directory:'), outDir);
            console.log(chalk_1.default.cyan('  Config File:'), configFile || 'None');
            console.log(chalk_1.default.cyan('  Overwrite:'), options.overwrite);
            console.log(chalk_1.default.cyan('  Generate Docs:'), options.generateDocs);
        }
        // Generate the MCP server
        console.log(chalk_1.default.green('Generating MCP server...'));
        await (0, index_1.generateMcpServer)(options);
        console.log(chalk_1.default.green('MCP server generated successfully!'));
        console.log(chalk_1.default.green(`Output directory: ${outDir}`));
    }
    catch (error) {
        // Improved error handling
        if (error instanceof Error) {
            console.error(formatError(error));
        }
        else {
            // For unknown error types
            console.error(chalk_1.default.red(`ERROR: ${JSON.stringify(error, null, 2)}`));
        }
        process.exit(1);
    }
});
// Parse command line arguments
program.parse(process.argv);
//# sourceMappingURL=cli.js.map