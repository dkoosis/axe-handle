// Path: templates/express/src/cli.ts
#!/usr/bin/env node

/**
 * File: axe-handle/src/cli.ts
 * Main CLI entry point for the Axe Handle MCP server code generator.
 */

import * as fs from 'fs';
import * as path from 'path';
import { program } from 'commander';
const chalk = require('chalk');
import inquirer from 'inquirer';
import { MCPServerGenerator, MCPServerGeneratorOptions } from './mcpServerGenerator';
import { parseMCPSchema, generateMarkdownDocumentation, SchemaAnalysisResult } from './mcpSchemaParser';
import * as packageJson from '../package.json';

// Configure CLI
program
    .name('axe-handle')
    .description('Generate MCP server code from a TypeScript schema')
    .version(packageJson.version);

/**
 * Generates an MCP server from a given schema.
 */
program
    .command('generate <schemaFilePath>')
    .description('Generate an MCP server from a schema')
    .argument('<schemaFilePath>', 'Path to the MCP schema file (TypeScript)')
    .option('-o, --output <outputDirectory>', 'Output directory', './mcp-server')
    .option('-f, --framework <serverFramework>', 'Server framework to use (express, nestjs, fastify)', 'express')
    .option('-c, --config <configFile>', 'Path to configuration file')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (
        schemaFilePath: string,
        options: { output: string; framework: string; config?: string; yes?: boolean }
    ) => {
        try {
            const resolvedSchemaPath = path.resolve(schemaFilePath);
            const outputDir = path.resolve(options.output);
            const serverFramework = options.framework;

            // Validate schema file existence.
            if (!fs.existsSync(resolvedSchemaPath)) {
                console.error(chalk.red(`Error: Schema file not found: ${resolvedSchemaPath}`));
                process.exit(1);
            }

            // Load configuration file if provided.
            let config: Partial<MCPServerGeneratorOptions> = {};
            if (options.config) {
                const configPath = path.resolve(options.config);
                if (!fs.existsSync(configPath)) {
                    console.error(chalk.red(`Error: Configuration file not found: ${configPath}`));
                    process.exit(1);
                }
                try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } catch (error) {
                    console.error(chalk.red(`Error parsing configuration file: ${(error as Error).message}`));
                    process.exit(1);
                }
            }

            // Validate selected framework.
            const validFrameworks: string[] = ['express', 'nestjs', 'fastify'];
            if (!validFrameworks.includes(serverFramework)) {
                console.error(chalk.red(`Error: Invalid framework '${serverFramework}'. Valid options are: ${validFrameworks.join(', ')}`));
                process.exit(1);
            }

            // Check for output directory conflicts and prompt for overwrite.
            let shouldOverwrite = options.yes || false;
            if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0) {
                if (!shouldOverwrite) {
                    const answer = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'overwrite',
                        message: `Output directory ${outputDir} is not empty. Overwrite existing files?`,
                        default: false,
                    }]);
                    shouldOverwrite = answer.overwrite;
                }
            }

            if (!shouldOverwrite) {
                console.log(chalk.yellow('Operation cancelled.'));
                process.exit(0);
            }

            // Create and configure the generator.
            const generatorOptions: MCPServerGeneratorOptions = {
                schemaPath: resolvedSchemaPath,
                outputDir,
                framework: serverFramework,
                config,
            };
            const generator = new MCPServerGenerator(generatorOptions);

            // Execute the code generation.
            console.log(chalk.blue('Starting MCP server code generation...'));
            console.log(`Schema: ${chalk.green(resolvedSchemaPath)}`);
            console.log(`Output: ${chalk.green(outputDir)}`);
            console.log(`Framework: ${chalk.green(serverFramework)}`);

            const isGenerationSuccessful = await generator.generate();

            if (isGenerationSuccessful) {
                console.log(chalk.green('\n✓ MCP server code generation completed successfully!'));
                console.log('\nNext steps:');
                console.log(`  1. cd ${options.output}`);
                console.log('  2. npm install');
                console.log('  3. npm run dev');
            } else {
                console.error(chalk.red('\n✗ MCP server code generation failed!'));
                process.exit(1);
            }
        } catch (error) {
            console.error(chalk.red(`\nError: ${(error as Error).message}`));
            console.error((error as Error).stack);
            process.exit(1);
        }
    });

/**
 * Analyzes an MCP schema file and provides a summary or detailed documentation.
 */
program
    .command('analyze <schemaFilePath>')
    .description('Analyze an MCP schema file')
    .argument('<schemaFilePath>', 'Path to MCP schema file (TypeScript)')
    .option('-o, --output <outputFile>', 'Output analysis to file')
    .action(async (schemaFilePath: string, options: { output?: string }) => {
        try {
            const resolvedSchemaPath = path.resolve(schemaFilePath);

            // Validate schema file existence.
            if (!fs.existsSync(resolvedSchemaPath)) {
                console.error(chalk.red(`Error: Schema file not found: ${resolvedSchemaPath}`));
                process.exit(1);
            }

            console.log(chalk.blue(`Analyzing MCP schema: ${resolvedSchemaPath}`));

            // Parse the schema.
            const parsedSchema: SchemaAnalysisResult = parseMCPSchema(resolvedSchemaPath);

            // Display a summary of the schema analysis.
            console.log(chalk.green('\nSchema Summary:'));
            console.log(`Protocol Version: ${chalk.cyan(parsedSchema.version)}`);
            console.log(`Interfaces: ${chalk.cyan(parsedSchema.summary.interfaceCount)}`);
            console.log(`Type Aliases: ${chalk.cyan(parsedSchema.summary.typeCount)}`);
            console.log(`Constants: ${chalk.cyan(parsedSchema.summary.constantCount)}`);

            // Generate detailed Markdown documentation.
            const markdownDocumentation: string = generateMarkdownDocumentation(parsedSchema);

            // Output to file or console.
            if (options.output) {
                const outputPath = path.resolve(options.output);
                fs.writeFileSync(outputPath, markdownDocumentation);
                console.log(chalk.green(`\nDetailed documentation written to: ${outputPath}`));
            } else {
                // Output brief analysis.
                console.log(chalk.green('\nInterfaces:'));
                Object.keys(parsedSchema.interfaces)
                    .slice(0, 10)  // Limit to the first 10 interfaces.
                    .forEach(interfaceName => {
                        console.log(`- ${chalk.cyan(interfaceName)}`);
                    });

                if (Object.keys(parsedSchema.interfaces).length > 10) {
                    console.log(`  ... and ${Object.keys(parsedSchema.interfaces).length - 10} more`);
                }

                console.log(chalk.green('\nType Aliases:'));
                Object.keys(parsedSchema.types)
                    .slice(0, 10) // Limit to first 10 types
                    .forEach(typeName => {
                        console.log(`- ${chalk.cyan(typeName)}`);
                    });

                if (Object.keys(parsedSchema.types).length > 10) {
                    console.log(`  ... and ${Object.keys(parsedSchema.types).length - 10} more`);
                }
                console.log(chalk.yellow('\nUse the --output option to generate detailed documentation.'));
            }
        } catch (error) {
            console.error(chalk.red(`\nError: ${(error as Error).message}`));
            console.error((error as Error).stack);
            process.exit(1);
        }
    });

/**
 * Initializes a new MCP server project with a basic directory structure and sample files.
 */
program
    .command('init')
    .description('Initialize a new MCP server project')
    .option('-n, --name <projectName>', 'Project name', 'mcp-server')
    .option('-d, --description <projectDescription>', 'Project description', 'MCP Protocol Server')
    .option('-f, --framework <serverFramework>', 'Server framework to use', 'express')
    .option('-o, --output <outputDir>', 'Output directory', '.')
    .action(async (options: { name: string; description: string; framework: string; output: string }) => {
        try {
            // Prompt for project details, using provided options as defaults.
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Project name:',
                    default: options.name,
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Project description:',
                    default: options.description,
                },
                {
                    type: 'list',
                    name: 'framework',
                    message: 'Select server framework:',
                    choices: ['express', 'nestjs', 'fastify'],
                    default: options.framework,
                },
                {
                    type: 'input',
                    name: 'author',
                    message: 'Author:',
                    default: process.env.USER || 'MCP Generator User',
                },
                {
                    type: 'list',
                    name: 'license',
                    message: 'License:',
                    choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense'],
                    default: 'MIT',
                },
            ]);

            const outputDir = path.resolve(options.output);

            // Create the output directory if it doesn't exist.
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Create the axe-handle configuration file.
            const config: { projectName: string; description: string; author: string; version: string; license: string; framework: string; } = {
                projectName: answers.name,
                description: answers.description,
                author: answers.author,
                version: '0.1.0',
                license: answers.license,
                framework: answers.framework,
            };
            const configPath = path.join(outputDir, 'axe-handle.json');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

            // Create the basic project directory structure.
            const srcDir = path.join(outputDir, 'src');
            const schemaDir = path.join(srcDir, 'schema');

            if (!fs.existsSync(srcDir)) {
                fs.mkdirSync(srcDir, { recursive: true });
            }

            if (!fs.existsSync(schemaDir)) {
                fs.mkdirSync(schemaDir, { recursive: true });
            }

            // Create a sample schema file.
            const schemaFilePath = path.join(schemaDir, 'mcp-protocol.ts');
            if (!fs.existsSync(schemaFilePath)) {
                // Use a template if available, otherwise create a minimal schema.
                const templateSchemaPath = path.join(__dirname, '..', 'templates', 'schema-template.ts'); //Adjusted path
                let schemaContent: string;

                if (fs.existsSync(templateSchemaPath)) {
                    schemaContent = fs.readFileSync(templateSchemaPath, 'utf8');
                } else {
                    // Minimal schema template.
                    schemaContent = `// MCP Schema - Minimal Version
export const LATEST_PROTOCOL_VERSION = "DRAFT-2025-v1";
export const JSONRPC_VERSION = "2.0";

export type RequestId = string | number;

export interface JSONRPCRequest {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  result: any;
}

export interface JSONRPCNotification {
  jsonrpc: typeof JSONRPC_VERSION;
  method: string;
  params?: any;
}

export interface JSONRPCError {
  jsonrpc: typeof JSONRPC_VERSION;
  id: RequestId;
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

export type JSONRPCMessage =
  | JSONRPCRequest
  | JSONRPCResponse
  | JSONRPCNotification
  | JSONRPCError;
`;
                }
                fs.writeFileSync(schemaFilePath, schemaContent);
            }

            // Create a README file.
            const readmePath = path.join(outputDir, 'README.md');
            if (!fs.existsSync(readmePath)) {
                const readmeContent = `# ${answers.name}

${answers.description}

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Installation

\`\`\`bash
npm install
\`\`\`

### Running the Server

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
\`\`\`

## License

This project is licensed under the ${answers.license} License.
`;
                fs.writeFileSync(readmePath, readmeContent);
            }

            console.log(chalk.green('\n✓ Project initialized successfully!'));
            console.log('\nNext steps:');
            console.log(chalk.blue(`  1. Review and customize the schema file at ${path.relative(process.cwd(), schemaFilePath)}`));
            console.log(chalk.blue(`  2. Run 'axe-handle generate ${path.relative(process.cwd(), schemaFilePath)} -o ${outputDir}'`));

        } catch (error) {
            console.error(chalk.red(`\nError: ${(error as Error).message}`));
            console.error((error as Error).stack);
            process.exit(1);
        }
    });

// Execute the program.
program.parse(process.argv);