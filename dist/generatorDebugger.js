"use strict";
// Path: src/generatorDebugger.ts
// Debug utility for the Axe Handle generator with enhanced error detection
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const chalk_1 = __importDefault(require("chalk"));
const index_1 = require("./index");
const configManager_1 = require("./utils/configManager");
const templateManager_1 = require("./utils/templateManager");
const mcpProtocolParser_1 = require("./parser/mcpProtocolParser");
const mcpSchemaAdapter_1 = require("./parser/mcpSchemaAdapter");
const serviceParser_1 = require("./parser/serviceParser");
const mapper_1 = require("./mcp/mapper");
const generator_1 = require("./generator/generator");
// Hardcoded paths for easier debugging
const schemaFile = path_1.default.resolve(__dirname, '../schemas/examples/calendar.proto');
const outputDir = path_1.default.resolve(__dirname, '../debug-output');
const templatesDir = path_1.default.resolve(__dirname, '../templates');
/**
 * Ensures that the templates and output directories exist.
 * Creates the output directory if it doesn't exist.
 * @throws {Error} If the templates directory is not found or the output directory cannot be created.
 */
async function ensureDirectories() {
    try {
        // Check if templates directory exists
        try {
            await promises_1.default.access(templatesDir);
            console.log(chalk_1.default.green(`✓ Templates directory exists: ${templatesDir}`));
            // List templates to verify they're accessible
            const templates = await promises_1.default.readdir(templatesDir);
            console.log(chalk_1.default.cyan('Available templates:'), templates.join(', '));
        }
        catch (err) {
            console.error(chalk_1.default.red(`✗ Templates directory not found: ${templatesDir}`));
            throw new Error(`Templates directory not found: ${templatesDir}`);
        }
        // Create output directory if it doesn't exist
        await promises_1.default.mkdir(outputDir, { recursive: true });
        console.log(chalk_1.default.green(`✓ Output directory ready: ${outputDir}`));
    }
    catch (err) {
        console.error(chalk_1.default.red('Directory setup failed:'), err);
        throw err;
    }
}
/**
 * Performs a step-by-step debug process to isolate and identify issues in the code generation.
 * @throws {Error} If any of the debug steps encounter an error.
 */
async function debugStepByStep() {
    console.log(chalk_1.default.yellow('\n--- Step-by-Step Debugging ---'));
    try {
        // Step 1: Initialize config and template managers
        console.log(chalk_1.default.blue('\nStep 1: Initializing managers...'));
        (0, templateManager_1.getTemplateManager)(templatesDir);
        (0, configManager_1.getConfigManager)();
        console.log(chalk_1.default.green('✓ Managers initialized'));
        // Step 2: Parse MCP Schema
        console.log(chalk_1.default.blue('\nStep 2: Parsing MCP Schema...'));
        const schemaPath = path_1.default.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');
        let mcpSpec;
        try {
            console.log('Attempting to use full MCP parser...');
            mcpSpec = await mcpProtocolParser_1.mcpProtocolParser.parseProtocol();
            console.log(chalk_1.default.green('✓ MCP protocol parsed successfully'));
        }
        catch (error) {
            console.log(chalk_1.default.yellow('Full parser failed, trying adapter instead...'));
            mcpSpec = await (0, mcpSchemaAdapter_1.extractMcpProtocol)(schemaPath);
            console.log(chalk_1.default.green('✓ MCP protocol extracted via adapter'));
        }
        console.log('MCP protocol version:', mcpSpec.version);
        console.log('Operations:', mcpSpec.operations.length);
        console.log('Types:', mcpSpec.types.length);
        console.log('Capabilities:', mcpSpec.capabilities.length);
        // Step 3: Parse User Service
        console.log(chalk_1.default.blue('\nStep 3: Parsing User Service...'));
        console.log('Schema file:', schemaFile);
        // Check if schema file exists
        try {
            await promises_1.default.access(schemaFile);
            console.log(chalk_1.default.green(`✓ Schema file exists: ${schemaFile}`));
        }
        catch (err) {
            console.error(chalk_1.default.red(`✗ Schema file not found: ${schemaFile}`));
            throw new Error(`Schema file not found: ${schemaFile}`);
        }
        const userService = await serviceParser_1.serviceParser.parseService(schemaFile, mcpSpec);
        console.log(chalk_1.default.green('✓ User service parsed successfully'));
        console.log('Service name:', userService.name);
        console.log('Resources:', userService.resources.length);
        console.log('Types:', userService.types.length);
        // Step 4: Map Service to MCP Concepts
        console.log(chalk_1.default.blue('\nStep 4: Mapping Service to MCP Concepts...'));
        const mappedService = mapper_1.mapper.mapServiceToMcp(userService);
        console.log(chalk_1.default.green('✓ Service mapped successfully'));
        console.log('Mapped resources:', mappedService.resources.length);
        console.log('Mapped types:', mappedService.types.length);
        // Step 5: Validate Templates
        console.log(chalk_1.default.blue('\nStep 5: Validating Templates...'));
        // Check essential templates
        const essentialTemplates = [
            { framework: 'express', category: 'server', name: 'server' },
            { framework: 'express', category: 'types', name: 'types' },
            { framework: 'express', category: 'handler', name: 'handler' },
            { framework: 'express', category: 'index', name: 'index' },
            { framework: 'express', category: 'api', name: 'api' }
        ];
        for (const template of essentialTemplates) {
            const templatePath = path_1.default.join(templatesDir, template.framework, `${template.category}/${template.name}.ejs`);
            try {
                await promises_1.default.access(templatePath);
                console.log(chalk_1.default.green(`✓ Template exists: ${templatePath}`));
            }
            catch (err) {
                console.error(chalk_1.default.red(`✗ Template missing: ${templatePath}`));
            }
        }
        // Step 6: Generate Server Code
        console.log(chalk_1.default.blue('\nStep 6: Generating Server Code...'));
        // Create generator options
        const options = {
            inputFile: schemaFile,
            outputDir: outputDir,
            overwrite: true,
            generateDocs: true,
            verbose: true
        };
        // Instead of using the full generateMcpServer which has wrapped error handling,
        // call the generator directly to see the actual error
        await generator_1.generator.generateServer(mappedService, options);
        console.log(chalk_1.default.green('✓ Server code generated successfully!'));
    }
    catch (error) {
        console.error(chalk_1.default.red('\nDebug process failed with error:'));
        if (error instanceof Error) {
            console.error(`Name: ${error.name}`);
            console.error(`Message: ${error.message}`);
            console.error(`Stack: ${error.stack}`);
            // Output additional properties for error
            if (error && typeof error === 'object' && 'code' in error) {
                console.error(`Code: ${error.code}`);
            }
            if (error && typeof error === 'object' && 'details' in error) {
                console.error(`Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            if (error && typeof error === 'object' && 'cause' in error && error.cause) {
                console.error(`Cause: ${JSON.stringify(error.cause, null, 2)}`);
            }
        }
        else {
            console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
        }
    }
}
// Create generator options
const options = {
    inputFile: schemaFile,
    outputDir: outputDir,
    overwrite: true,
    generateDocs: true,
    verbose: true
};
// Run setup and debugging
async function runDebug() {
    console.log(chalk_1.default.cyan('===== Axe Handle Generator Debugger ====='));
    console.log(chalk_1.default.cyan('Schema file: ') + schemaFile);
    console.log(chalk_1.default.cyan('Output directory: ') + outputDir);
    console.log(chalk_1.default.cyan('Templates directory: ') + templatesDir);
    try {
        // Ensure directories exist
        await ensureDirectories();
        // First try with step-by-step debugging
        await debugStepByStep();
        // If step-by-step debugging succeeds, try the full generator
        console.log(chalk_1.default.yellow('\n--- Running Full Generator ---'));
        await (0, index_1.generateMcpServer)(options);
        console.log(chalk_1.default.green('\n✅ Full generation completed successfully!'));
        // List generated files
        const files = await promises_1.default.readdir(outputDir, { recursive: true });
        console.log(chalk_1.default.cyan('\nGenerated files:'));
        files.forEach(file => console.log(`- ${file}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('\nDebugger failed:'));
        if (error instanceof Error) {
            console.error(`Name: ${error.name}`);
            console.error(`Message: ${error.message}`);
            console.error(`Stack: ${error.stack}`);
            // Output additional properties for error
            if (error && typeof error === 'object' && 'code' in error) {
                console.error(`Code: ${error.code}`);
            }
            if (error && typeof error === 'object' && 'details' in error) {
                console.error(`Details: ${JSON.stringify(error.details, null, 2)}`);
            }
            if (error && typeof error === 'object' && 'cause' in error && error.cause) {
                console.error(`Cause: ${JSON.stringify(error.cause, null, 2)}`);
            }
        }
        else {
            console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
        }
    }
}
// Run the debug function
runDebug();
//# sourceMappingURL=generatorDebugger.js.map