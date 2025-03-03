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
 * @param error The error to format.  Can be a standard Error or an AxeError.
 * @returns Formatted error message string.
 * @description Checks if the error has a 'code' property to determine if it's an AxeError.
 *  If so, formats the message with the code, message, details, and cause (recursively).
 *  If not, formats it as a generic error.  This distinction is important because
 *  AxeErrors have a structured format for reporting to the user.
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
 * @param category - The category of the error (e.g., CLI, GENERATOR).
 * @param code - A numeric code specific to the error within the category.
 * @param message - A human-readable error message.
 * @param details - (Optional) An object containing additional details about the error.
 * @param cause - (Optional) The underlying error that caused this error, if any.
 * @returns An AxeError object.
 * @description This function standardizes the creation of AxeError objects, ensuring
 *  consistent error code formatting and structure.
 */
function createAxeError(category, code, message, details, cause) {
    return {
        code: `${types_1.ErrorPrefix.AXE}-${category}${String(code).padStart(3, '0')}`,
        message,
        details,
        cause,
    };
}
// --- Custom Error Types ---
class InputFileNotFoundError extends Error {
    constructor(message, filePath, cause) {
        super(message);
        this.code = `${types_1.ErrorPrefix.AXE}-${types_1.AxeErrorCategory.CLI}001`;
        this.details = { path: filePath };
        this.cause = cause;
        this.name = 'InputFileNotFoundError'; // Important for instanceof checks
    }
}
class OutputDirectoryCreationError extends Error {
    constructor(message, dirPath, cause) {
        super(message);
        this.code = `${types_1.ErrorPrefix.AXE}-${types_1.AxeErrorCategory.CLI}002`;
        this.details = { path: dirPath };
        this.cause = cause;
        this.name = 'OutputDirectoryCreationError';
    }
}
class ConfigFileNotFoundError extends Error {
    constructor(message, filePath, cause) {
        super(message);
        this.code = `${types_1.ErrorPrefix.AXE}-${types_1.AxeErrorCategory.CLI}003`;
        this.details = { path: filePath };
        this.cause = cause;
        this.name = 'ConfigFileNotFoundError';
    }
}
// --- End Custom Error Types ---
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
            throw new InputFileNotFoundError(`Input file not found: ${schemaFile}`, inputFile, error instanceof Error ? error : undefined);
        }
        // Validate output directory
        const outDir = path_1.default.resolve(process.cwd(), outputDir);
        try {
            await promises_1.default.mkdir(outDir, { recursive: true });
        }
        catch (error) {
            throw new OutputDirectoryCreationError(`Failed to create output directory: ${outputDir}`, outDir, error instanceof Error ? error : undefined);
        }
        // Validate config file if provided
        let configFile = undefined;
        if (cmdOptions.config) {
            configFile = path_1.default.resolve(process.cwd(), cmdOptions.config);
            try {
                await promises_1.default.access(configFile);
            }
            catch (error) {
                throw new ConfigFileNotFoundError(`Configuration file not found: ${cmdOptions.config}`, configFile, error instanceof Error ? error : undefined);
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
        // Improved error handling using instanceof
        if (error instanceof InputFileNotFoundError || error instanceof OutputDirectoryCreationError || error instanceof ConfigFileNotFoundError) {
            console.error(formatError(error));
        }
        else if (error instanceof Error) {
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