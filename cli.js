#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const MCPServerGenerator = require('./generator');
const packageJson = require('./package.json');

// Configure CLI
program
  .name('axe-handle')
  .description('Generate MCP server code from schema')
  .version(packageJson.version);

// Generate command
program
  .command('generate')
  .description('Generate an MCP server from schema')
  .argument('<schema>', 'Path to MCP schema file (TypeScript)')
  .option('-o, --output <dir>', 'Output directory', './mcp-server')
  .option('-f, --framework <framework>', 'Server framework to use', 'express')
  .option('-c, --config <file>', 'Path to configuration file')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(async (schema, options) => {
    try {
      // Validate schema file
      if (!fs.existsSync(schema)) {
        console.error(chalk.red(`Error: Schema file not found: ${schema}`));
        process.exit(1);
      }

      // Resolve paths
      const schemaPath = path.resolve(schema);
      const outputDir = path.resolve(options.output);
      
      // Load configuration if provided
      let config = {};
      if (options.config) {
        const configPath = path.resolve(options.config);
        if (!fs.existsSync(configPath)) {
          console.error(chalk.red(`Error: Configuration file not found: ${configPath}`));
          process.exit(1);
        }
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
          console.error(chalk.red(`Error parsing configuration file: ${error.message}`));
          process.exit(1);
        }
      }
      
      // Validate framework
      const validFrameworks = ['express', 'nestjs', 'fastify'];
      if (!validFrameworks.includes(options.framework)) {
        console.error(chalk.red(`Error: Invalid framework '${options.framework}'. Valid options are: ${validFrameworks.join(', ')}`));
        process.exit(1);
      }
      
      // Check if output directory exists and is not empty
      let shouldContinue = options.yes;
      if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length > 0 && !shouldContinue) {
        const answer = await inquirer.prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: `Output directory ${outputDir} is not empty. Overwrite existing files?`,
          default: false
        }]);
        shouldContinue = answer.overwrite;
      }
      
      if (!shouldContinue) {
        console.log(chalk.yellow('Operation cancelled.'));
        process.exit(0);
      }
      
      // Create generator instance
      const generator = new MCPServerGenerator({
        schemaPath,
        outputDir,
        framework: options.framework,
        config
      });

// Analyze command
program
  .command('analyze')
  .description('Analyze an MCP schema file')
  .argument('<schema>', 'Path to MCP schema file (TypeScript)')
  .option('-o, --output <file>', 'Output analysis to file')
  .action(async (schema, options) => {
    try {
      // Validate schema file
      if (!fs.existsSync(schema)) {
        console.error(chalk.red(`Error: Schema file not found: ${schema}`));
        process.exit(1);
      }

      // Resolve paths
      const schemaPath = path.resolve(schema);
      
      const { parseMCPSchema, generateMarkdown } = require('./ts-parser');
      
      console.log(chalk.blue(`Analyzing MCP schema: ${schemaPath}`));
      
      // Parse schema
      const parsedSchema = parseMCPSchema(schemaPath);
      
      // Generate summary
      console.log(chalk.green('\nSchema Summary:'));
      console.log(`Protocol Version: ${chalk.cyan(parsedSchema.version)}`);
      console.log(`Interfaces: ${chalk.cyan(parsedSchema.summary.interfaceCount)}`);
      console.log(`Type Aliases: ${chalk.cyan(parsedSchema.summary.typeCount)}`);
      console.log(`Constants: ${chalk.cyan(parsedSchema.summary.constantCount)}`);
      
      // Generate detailed markdown documentation
      const markdown = generateMarkdown(parsedSchema);
      
      // Output to file if requested
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, markdown);
        console.log(chalk.green(`\nDetailed documentation written to: ${outputPath}`));
      } else {
        // Output brief analysis to console
        console.log(chalk.green('\nInterfaces:'));
        Object.keys(parsedSchema.interfaces)
          .slice(0, 10) // Show only first 10
          .forEach(name => {
            console.log(`- ${chalk.cyan(name)}`);
          });
        
        if (Object.keys(parsedSchema.interfaces).length > 10) {
          console.log(`  ... and ${Object.keys(parsedSchema.interfaces).length - 10} more`);
        }
        
        console.log(chalk.green('\nType Aliases:'));
        Object.keys(parsedSchema.types)
          .slice(0, 10) // Show only first 10
          .forEach(name => {
            console.log(`- ${chalk.cyan(name)}`);
          });
        
        if (Object.keys(parsedSchema.types).length > 10) {
          console.log(`  ... and ${Object.keys(parsedSchema.types).length - 10} more`);
        }
        
        console.log(chalk.yellow('\nUse the --output option to generate detailed documentation.'));
      }
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });
  
// Execute program
program.parse(process.argv);
      
      // Run generation
      console.log(chalk.blue('Starting MCP server code generation...'));
      console.log(`Schema: ${chalk.green(schemaPath)}`);
      console.log(`Output: ${chalk.green(outputDir)}`);
      console.log(`Framework: ${chalk.green(options.framework)}`);
      
      const success = await generator.generate();
      
      if (success) {
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
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });

// Initialize command
program
  .command('init')
  .description('Initialize a new MCP server project')
  .option('-n, --name <name>', 'Project name', 'mcp-server')
  .option('-d, --description <description>', 'Project description', 'MCP Protocol Server')
  .option('-f, --framework <framework>', 'Server framework to use', 'express')
  .option('-o, --output <dir>', 'Output directory', '.')
  .action(async (options) => {
    try {
      // Ask for project details
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: options.name
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project description:',
          default: options.description
        },
        {
          type: 'list',
          name: 'framework',
          message: 'Select server framework:',
          choices: ['express', 'nestjs', 'fastify'],
          default: options.framework
        },
        {
          type: 'input',
          name: 'author',
          message: 'Author:',
          default: process.env.USER || 'MCP Generator User'
        },
        {
          type: 'list',
          name: 'license',
          message: 'License:',
          choices: ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Unlicense'],
          default: 'MIT'
        }
      ]);
      
      // Create output directory
      const outputDir = path.resolve(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create config file
      const configPath = path.join(outputDir, 'axe-handle.json');
      const config = {
        projectName: answers.name,
        description: answers.description,
        author: answers.author,
        version: '0.1.0',
        license: answers.license,
        framework: answers.framework
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      // Create basic file structure
      const srcDir = path.join(outputDir, 'src');
      const schemaDir = path.join(srcDir, 'schema');
      
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }
      
      if (!fs.existsSync(schemaDir)) {
        fs.mkdirSync(schemaDir, { recursive: true });
      }
      
      // Create sample schema file
      const schemaFile = path.join(schemaDir, 'mcp-schema.ts');
      if (!fs.existsSync(schemaFile)) {
        // Copy schema template or create minimal schema
        const templateSchemaPath = path.join(__dirname, 'templates', 'schema-template.ts');
        if (fs.existsSync(templateSchemaPath)) {
          fs.copyFileSync(templateSchemaPath, schemaFile);
        } else {
          // Minimal schema template
          const minimalSchema = `// MCP Schema - Minimal Version
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
          fs.writeFileSync(schemaFile, minimalSchema);
        }
      }
      
      // Create README.md
      const readmePath = path.join(outputDir, 'README.md');
      if (!fs.existsSync(readmePath)) {
        const readme = `# ${answers.name}

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
        fs.writeFileSync(readmePath, readme);
      }
      
      console.log(chalk.green('\n✓ Project initialized successfully!'));
      console.log('\nNext steps:');
      console.log(chalk.blue(`  1. Review and customize the schema file at ${path.relative(process.cwd(), schemaFile)}`));
      console.log(chalk.blue(`  2. Run 'axe-handle generate ${path.relative(process.cwd(), schemaFile)} -o ${outputDir}'`));
      
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(error.stack);
      process.exit(1);
    }
  });