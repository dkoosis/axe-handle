// Path: src/generatorDebugger.ts
// Debug utility for the Axe Handle generator with enhanced error detection

import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';
import { generateMcpServer } from './index';
import { GeneratorOptions } from './types';
import { getConfigManager } from './utils/configManager';
import { getTemplateManager } from './utils/templateManager';
import { mcpProtocolParser } from './parser/mcpProtocolParser';
import { extractMcpProtocol } from './parser/mcpSchemaAdapter';
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { generator } from './generator/mcpServerGenerator';

// Hardcoded paths for easier debugging
const schemaFile = path.resolve(__dirname, '../schemas/examples/calendar.proto');
const outputDir = path.resolve(__dirname, '../debug-output');
const templatesDir = path.resolve(__dirname, '../templates');

/**
 * Ensures that the templates and output directories exist.
 * Creates the output directory if it doesn't exist.
 * @throws {Error} If the templates directory is not found or the output directory cannot be created.
 */
async function ensureDirectories() {
  try {
    // Check if templates directory exists
    try {
      await fs.access(templatesDir);
      console.log(chalk.green(`✓ Templates directory exists: ${templatesDir}`));
      
      // List templates to verify they're accessible
      const templates = await fs.readdir(templatesDir);
      console.log(chalk.cyan('Available templates:'), templates.join(', '));
    } catch (err) {
      console.error(chalk.red(`✗ Templates directory not found: ${templatesDir}`));
      throw new Error(`Templates directory not found: ${templatesDir}`);
    }
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputDir, { recursive: true });
    console.log(chalk.green(`✓ Output directory ready: ${outputDir}`));
  } catch (err) {
    console.error(chalk.red('Directory setup failed:'), err);
    throw err;
  }
}

/**
 * Performs a step-by-step debug process to isolate and identify issues in the code generation.
 * @throws {Error} If any of the debug steps encounter an error.
 */
async function debugStepByStep() {
  console.log(chalk.yellow('\n--- Step-by-Step Debugging ---'));
  
  try {
    // Step 1: Initialize config and template managers
    console.log(chalk.blue('\nStep 1: Initializing managers...'));
    getTemplateManager(templatesDir);
    getConfigManager();
    console.log(chalk.green('✓ Managers initialized'));
    
    // Step 2: Parse MCP Schema
    console.log(chalk.blue('\nStep 2: Parsing MCP Schema...'));
    const schemaPath = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');
    
    let mcpSpec;
    try {
      console.log('Attempting to use full MCP parser...');
      mcpSpec = await mcpProtocolParser.parseProtocol();
      console.log(chalk.green('✓ MCP protocol parsed successfully'));
    } catch (error) {
      console.log(chalk.yellow('Full parser failed, trying adapter instead...'));
      mcpSpec = await extractMcpProtocol(schemaPath);
      console.log(chalk.green('✓ MCP protocol extracted via adapter'));
    }
    
    console.log('MCP protocol version:', mcpSpec.version);
    console.log('Operations:', mcpSpec.operations.length);
    console.log('Types:', mcpSpec.types.length);
    console.log('Capabilities:', mcpSpec.capabilities.length);
    
    // Step 3: Parse User Service
    console.log(chalk.blue('\nStep 3: Parsing User Service...'));
    console.log('Schema file:', schemaFile);
    
    // Check if schema file exists
    try {
      await fs.access(schemaFile);
      console.log(chalk.green(`✓ Schema file exists: ${schemaFile}`));
    } catch (err) {
      console.error(chalk.red(`✗ Schema file not found: ${schemaFile}`));
      throw new Error(`Schema file not found: ${schemaFile}`);
    }
    
    const userService = await serviceParser.parseService(schemaFile, mcpSpec);
    console.log(chalk.green('✓ User service parsed successfully'));
    console.log('Service name:', userService.name);
    console.log('Resources:', userService.resources.length);
    console.log('Types:', userService.types.length);
    
    // Step 4: Map Service to MCP Concepts
    console.log(chalk.blue('\nStep 4: Mapping Service to MCP Concepts...'));
    const mappedService = mapper.mapServiceToMcp(userService);
    console.log(chalk.green('✓ Service mapped successfully'));
    console.log('Mapped resources:', mappedService.resources.length);
    console.log('Mapped types:', mappedService.types.length);
    
    // Step 5: Validate Templates
    console.log(chalk.blue('\nStep 5: Validating Templates...'));
    
    // Check essential templates
    const essentialTemplates = [
      { framework: 'express', category: 'server', name: 'server' },
      { framework: 'express', category: 'types', name: 'types' },
      { framework: 'express', category: 'handler', name: 'handler' },
      { framework: 'express', category: 'index', name: 'index' },
      { framework: 'express', category: 'api', name: 'api' }
    ];
    
    for (const template of essentialTemplates) {
      const templatePath = path.join(templatesDir, template.framework, `${template.category}/${template.name}.ejs`);
      try {
        await fs.access(templatePath);
        console.log(chalk.green(`✓ Template exists: ${templatePath}`));
      } catch (err) {
        console.error(chalk.red(`✗ Template missing: ${templatePath}`));
      }
    }
    
    // Step 6: Generate Server Code
    console.log(chalk.blue('\nStep 6: Generating Server Code...'));
    // Create generator options
    const options: GeneratorOptions = {
      inputFile: schemaFile,
      outputDir: outputDir,
      overwrite: true,
      generateDocs: true,
      verbose: true
    };
    
    // Instead of using the full generateMcpServer which has wrapped error handling,
    // call the generator directly to see the actual error
    await generator.generateServer(mappedService, options);
    console.log(chalk.green('✓ Server code generated successfully!'));
    
  } catch (error) {
    console.error(chalk.red('\nDebug process failed with error:'));
    
    if (error instanceof Error) {
      console.error(`Name: ${error.name}`);
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      
      // Output additional properties for error
      if (error && typeof error === 'object' && 'code' in error) {
        console.error(`Code: ${(error as any).code}`);
      }
      if (error && typeof error === 'object' && 'details' in error) {
        console.error(`Details: ${JSON.stringify((error as any).details, null, 2)}`);
      }
      if (error && typeof error === 'object' && 'cause' in error && (error as any).cause) {
        console.error(`Cause: ${JSON.stringify((error as any).cause, null, 2)}`);
      }
    } else {
      console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
    }
  }
}

// Create generator options
const options: GeneratorOptions = {
  inputFile: schemaFile,
  outputDir: outputDir,
  overwrite: true,
  generateDocs: true,
  verbose: true
};

// Run setup and debugging
async function runDebug() {
  console.log(chalk.cyan('===== Axe Handle Generator Debugger ====='));
  console.log(chalk.cyan('Schema file: ') + schemaFile);
  console.log(chalk.cyan('Output directory: ') + outputDir);
  console.log(chalk.cyan('Templates directory: ') + templatesDir);
  
  try {
    // Ensure directories exist
    await ensureDirectories();
    
    // First try with step-by-step debugging
    await debugStepByStep();
    
    // If step-by-step debugging succeeds, try the full generator
    console.log(chalk.yellow('\n--- Running Full Generator ---'));
    await generateMcpServer(options);
    console.log(chalk.green('\n✅ Full generation completed successfully!'));
    
    // List generated files
    const files = await fs.readdir(outputDir, { recursive: true });
    console.log(chalk.cyan('\nGenerated files:'));
    files.forEach(file => console.log(`- ${file}`));
    
  } catch (error) {
    console.error(chalk.red('\nDebugger failed:'));
    if (error instanceof Error) {
      console.error(`Name: ${error.name}`);
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      
      // Output additional properties for error
      if (error && typeof error === 'object' && 'code' in error) {
        console.error(`Code: ${(error as any).code}`);
      }
      if (error && typeof error === 'object' && 'details' in error) {
        console.error(`Details: ${JSON.stringify((error as any).details, null, 2)}`);
      }
      if (error && typeof error === 'object' && 'cause' in error && (error as any).cause) {
        console.error(`Cause: ${JSON.stringify((error as any).cause, null, 2)}`);
      }
    } else {
      console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
    }
  }
}

// Run the debug function
runDebug();