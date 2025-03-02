#!/usr/bin/env node
"use strict";
// Path: src/cli.ts
// Provides the command-line interface for the Axe Handle code generator.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const chalk_1 = __importDefault(require("chalk"));
const index_1 = require("./index");
const errorUtils_1 = require("./utils/errorUtils");
const logger_1 = require("./utils/logger");
const configManager_1 = require("./utils/configManager");
// Initialize the application
(0, index_1.initialize)();
// Set up logging
const loggerManager = (0, logger_1.getLoggerManager)({
    level: logger_1.LogLevel.INFO,
    timestamps: false,
    colors: true
});
// Create CLI program
const program = new commander_1.Command();
program
    .name('axe-handle')
    .description('Generate an MCP server from a Protobuf schema')
    .version('0.1.0')
    .option('-v, --verbose', 'Enable verbose output', false)
    .option('--debug', 'Enable debug level logging', false)
    .hook('preAction', (thisCommand, actionCommand) => {
    // Set log level based on CLI flags
    if (actionCommand.opts().debug) {
        loggerManager.setLevel(logger_1.LogLevel.DEBUG);
    }
    else if (actionCommand.opts().verbose) {
        loggerManager.setLevel(logger_1.LogLevel.INFO);
    }
    else {
        loggerManager.setLevel(logger_1.LogLevel.WARN);
    }
});
program
    .command('generate')
    .description('Generate MCP server code from a schema')
    .argument('<schema>', 'Protobuf schema file (.proto) or OpenAPI specification (.yaml, .yml, .json)')
    .argument('<output-dir>', 'Output directory for generated code')
    .option('-c, --config <file>', 'Configuration file (JSON)')
    .option('-o, --overwrite', 'Overwrite existing files', false)
    .option('-d, --docs', 'Generate documentation', true)
    .option('-f, --framework <framework>', 'Server framework to use (express, nestjs, fastify)', 'express')
    .option('--no-install', 'Skip installing dependencies', false)
    .action(async (schemaFile, outputDir, cmdOptions) => {
    try {
        // Validate input file
        const inputFile = path.resolve(process.cwd(), schemaFile);
        try {
            await fs.access(inputFile);
        }
        catch (error) {
            throw (0, errorUtils_1.createCliError)(1, `Input file not found: ${schemaFile}`, { path: inputFile }, error instanceof Error ? error : undefined);
        }
        // Validate output directory
        const outDir = path.resolve(process.cwd(), outputDir);
        try {
            await fs.mkdir(outDir, { recursive: true });
        }
        catch (error) {
            throw (0, errorUtils_1.createCliError)(2, `Failed to create output directory: ${outputDir}`, { path: outDir }, error instanceof Error ? error : undefined);
        }
        // Validate framework
        const framework = cmdOptions.framework;
        if (!['express', 'nestjs', 'fastify'].includes(framework)) {
            throw (0, errorUtils_1.createCliError)(3, `Invalid framework: ${framework}. Must be one of: express, nestjs, fastify`, { framework });
        }
        // Validate config file if provided
        let configFile = undefined;
        if (cmdOptions.config) {
            configFile = path.resolve(process.cwd(), cmdOptions.config);
            try {
                await fs.access(configFile);
            }
            catch (error) {
                throw (0, errorUtils_1.createCliError)(4, `Configuration file not found: ${cmdOptions.config}`, { path: configFile }, error instanceof Error ? error : undefined);
            }
        }
        // Update configuration
        const configManager = (0, configManager_1.getConfigManager)();
        configManager.updateConfig({
            framework: framework
        });
        // Create generator options
        const options = {
            inputFile,
            outputDir: outDir,
            configFile,
            overwrite: cmdOptions.overwrite,
            generateDocs: cmdOptions.docs,
            verbose: program.opts().verbose || program.opts().debug
        };
        // Log options in verbose mode
        if (options.verbose) {
            console.log(chalk_1.default.cyan('Generator Options:'));
            console.log(chalk_1.default.cyan('  Input File:'), inputFile);
            console.log(chalk_1.default.cyan('  Output Directory:'), outDir);
            console.log(chalk_1.default.cyan('  Config File:'), configFile || 'None');
            console.log(chalk_1.default.cyan('  Framework:'), framework);
            console.log(chalk_1.default.cyan('  Overwrite:'), options.overwrite);
            console.log(chalk_1.default.cyan('  Generate Docs:'), options.generateDocs);
        }
        // Generate the MCP server
        console.log(chalk_1.default.green('Generating MCP server...'));
        await (0, index_1.generateMcpServer)(options);
        console.log(chalk_1.default.green('MCP server generated successfully!'));
        console.log(chalk_1.default.green(`Output directory: ${outDir}`));
        // Information about next steps
        console.log(chalk_1.default.cyan('\nNext steps:'));
        console.log(chalk_1.default.cyan(`  1. cd ${outputDir}`));
        if (!cmdOptions.noInstall) {
            console.log(chalk_1.default.cyan('  2. npm install (or yarn)'));
            console.log(chalk_1.default.cyan('  3. npm run dev (or yarn dev)'));
        }
        else {
            console.log(chalk_1.default.cyan('  2. Install dependencies: npm install (or yarn)'));
            console.log(chalk_1.default.cyan('  3. Start the server: npm run dev (or yarn dev)'));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red((0, errorUtils_1.formatErrorForCli)(error instanceof Error ? error : new Error(String(error)))));
        process.exit(1);
    }
});
program
    .command('init')
    .description('Initialize a new MCP project')
    .option('-n, --name <name>', 'Project name', 'mcp-server')
    .option('-d, --description <description>', 'Project description', 'MCP Protocol Server')
    .option('-f, --framework <framework>', 'Server framework to use (express, nestjs, fastify)', 'express')
    .option('-o, --output <directory>', 'Output directory', '.')
    .action(async (cmdOptions) => {
    try {
        // Validate framework
        const framework = cmdOptions.framework;
        if (!['express', 'nestjs', 'fastify'].includes(framework)) {
            throw (0, errorUtils_1.createCliError)(5, `Invalid framework: ${framework}. Must be one of: express, nestjs, fastify`, { framework });
        }
        // Validate output directory
        const outDir = path.resolve(process.cwd(), cmdOptions.output);
        try {
            await fs.mkdir(outDir, { recursive: true });
        }
        catch (error) {
            throw (0, errorUtils_1.createCliError)(6, `Failed to create output directory: ${cmdOptions.output}`, { path: outDir }, error instanceof Error ? error : undefined);
        }
        // Update configuration
        const configManager = (0, configManager_1.getConfigManager)();
        configManager.updateConfig({
            projectName: cmdOptions.name,
            description: cmdOptions.description,
            framework: framework
        });
        // Save configuration to the output directory
        const configPath = path.join(outDir, 'axe-handle.json');
        await configManager.saveConfigFile(configPath);
        console.log(chalk_1.default.green('Project initialized successfully!'));
        console.log(chalk_1.default.green(`Configuration saved to: ${configPath}`));
        // Information about next steps
        console.log(chalk_1.default.cyan('\nNext steps:'));
        console.log(chalk_1.default.cyan(`  1. Create a Protobuf schema file`));
        console.log(chalk_1.default.cyan(`  2. Generate the server: axe-handle generate <schema> ${cmdOptions.output}`));
    }
    catch (error) {
        console.error(chalk_1.default.red((0, errorUtils_1.formatErrorForCli)(error instanceof Error ? error : new Error(String(error)))));
        process.exit(1);
    }
});
// Parse command line arguments
program.parse(process.argv);
// If no arguments were provided, show help
if (process.argv.length === 2) {
    program.help();
}
//# sourceMappingURL=cli.js.map