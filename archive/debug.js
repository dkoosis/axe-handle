"use strict";
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
// @ts-nocheck
// @ts-nocheck
// src/debug.ts
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const eta = __importStar(require("eta"));
const chalk_1 = __importDefault(require("chalk"));
const mcpProtocolParser_1 = require("../src/parser/mcpProtocolParser");
const mcpSchemaAdapter_1 = require("../src/parser/mcpSchemaAdapter");
const serviceParser_1 = require("../src/parser/serviceParser");
const mapper_1 = require("../src/mcp/mapper");
const templateSystem_1 = require("../src/utils/templateSystem");
/**
 * Run a detailed debug to identify template loading issues
 */
async function runTemplateDebug() {
    console.log(chalk_1.default.cyan('=== Template Debug ==='));
    // Define paths
    const projectRoot = path.resolve(__dirname, '..');
    const templatesDir = path.join(projectRoot, 'templates');
    const schemaFile = path.join(projectRoot, 'schemas/examples/calendar.proto');
    console.log(`Project root: ${projectRoot}`);
    console.log(`Templates directory: ${templatesDir}`);
    console.log(`Schema file: ${schemaFile}`);
    // Check if directories exist
    console.log('\nChecking directories...');
    if (fs.existsSync(templatesDir)) {
        console.log(chalk_1.default.green(`✓ Templates directory exists`));
        // List templates
        const templates = fs.readdirSync(templatesDir);
        console.log(`Templates: ${templates.join(', ')}`);
        // Check express directory
        const expressDir = path.join(templatesDir, 'express');
        if (fs.existsSync(expressDir)) {
            console.log(chalk_1.default.green(`✓ Express templates directory exists`));
            // List express templates directories
            const expressDirs = fs.readdirSync(expressDir);
            console.log(`Express directories: ${expressDirs.join(', ')}`);
            // Check common template files
            for (const dir of expressDirs) {
                const dirPath = path.join(expressDir, dir);
                if (fs.statSync(dirPath).isDirectory()) {
                    console.log(`\nTemplate files in ${dir}:`);
                    try {
                        const files = fs.readdirSync(dirPath);
                        files.forEach(file => {
                            console.log(`  ${file}`);
                        });
                    }
                    catch (error) {
                        console.log(chalk_1.default.red(`  Error reading directory: ${error.message}`));
                    }
                }
            }
        }
        else {
            console.log(chalk_1.default.red(`✗ Express templates directory missing`));
        }
    }
    else {
        console.log(chalk_1.default.red(`✗ Templates directory missing`));
    }
    // Initialize the template system
    console.log('\nInitializing template system...');
    try {
        const templateSystem = (0, templateSystem_1.getTemplateSystem)({
            baseDir: templatesDir,
            framework: 'express',
            cache: false,
            helpers: {
                isRequestType: (type) => type.endsWith('Request'),
                isResponseType: (type) => type.endsWith('Result') || type.endsWith('Response'),
                getResponseTypeForRequest: (requestType) => requestType.replace('Request', 'Result'),
                getMethodFromRequest: (requestType) => {
                    const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
                    return methodParts.map(part => part.toLowerCase()).join('_');
                }
            }
        });
        console.log(chalk_1.default.green('✓ Template system initialized'));
        // Try to resolve some key templates
        console.log('\nResolving template paths...');
        const templates = ['types', 'server', 'handler', 'index', 'api'];
        const templatesList = templates || [];
        for (const template of templatesList) {
            try {
                const templatePath = templateSystem.resolveTemplatePath(template);
                if (fs.existsSync(templatePath)) {
                    console.log(chalk_1.default.green(`✓ Found template "${template}": ${templatePath}`));
                }
                else {
                    console.log(chalk_1.default.red(`✗ Template path resolved but file not found: ${templatePath}`));
                }
            }
            catch (error) {
                console.log(chalk_1.default.red(`✗ Error resolving "${template}": ${error.message}`));
            }
        }
        // Initialize Eta config
        console.log('\nInitializing Eta...');
        eta.configure({
            views: templatesDir,
            cache: false,
            autoEscape: false
        });
        console.log(chalk_1.default.green('✓ Eta configured'));
    }
    catch (error) {
        console.log(chalk_1.default.red(`✗ Template system initialization failed: ${error.message}`));
        console.log(error instanceof Error ? error.stack : String(error));
    }
    // Try to process the schema
    console.log('\nProcessing schema...');
    try {
        // Parse the MCP protocol
        console.log('Parsing MCP protocol...');
        let mcpSpec;
        try {
            mcpSpec = await mcpProtocolParser_1.mcpProtocolParser.parseProtocol();
            console.log(chalk_1.default.green('✓ MCP protocol parsed successfully'));
        }
        catch (error) {
            console.log(chalk_1.default.yellow('Full MCP parser failed, trying adapter...'));
            const schemaPath = path.resolve(projectRoot, 'schemas/mcp-spec/protocol.ts');
            mcpSpec = await (0, mcpSchemaAdapter_1.extractMcpProtocol)(schemaPath);
            console.log(chalk_1.default.green('✓ MCP protocol extracted using adapter'));
        }
        // Parse the user service
        console.log('\nParsing user service...');
        const userService = await serviceParser_1.serviceParser.parseService(schemaFile, mcpSpec);
        console.log(chalk_1.default.green(`✓ Service "${userService.name}" parsed with ${userService.resources.length} resources`));
        // Map to MCP concepts
        console.log('\nMapping to MCP concepts...');
        const mappedService = mapper_1.mapper.mapServiceToMcp(userService);
        console.log(chalk_1.default.green('✓ Service mapped successfully'));
        // Try rendering each template
        console.log('\nTesting template rendering...');
        const templateSystem = (0, templateSystem_1.getTemplateSystem)();
        // Test template rendering with a context object
        const context = {
            service: mappedService,
            date: new Date().toISOString(),
            version: '0.1.0'
        };
        const templatesList = templates || [];
        for (const template of templatesList) {
            try {
                console.log(`Rendering "${template}"...`);
                const templatePath = templateSystem.resolveTemplatePath(template);
                console.log(`Template path: ${templatePath}`);
                if (fs.existsSync(templatePath)) {
                    const content = fs.readFileSync(templatePath, 'utf-8');
                    console.log(`First 100 chars: ${content.slice(0, 100).replace(/\n/g, ' ')}...`);
                    // Try rendering
                    const rendered = await templateSystem.render(template, context);
                    console.log(chalk_1.default.green(`✓ Successfully rendered "${template}" (${rendered.length} chars)`));
                }
                else {
                    console.log(chalk_1.default.red(`✗ Template file not found`));
                }
            }
            catch (error) {
                console.log(chalk_1.default.red(`✗ Error rendering "${template}": ${error.message}`));
                console.log(error instanceof Error ? error.stack : String(error));
            }
        }
    }
    catch (error) {
        console.log(chalk_1.default.red(`✗ Schema processing failed: ${error.message}`));
        console.log(error instanceof Error ? error.stack : String(error));
    }
}
// Run the debug
runTemplateDebug().catch(console.error);
//# sourceMappingURL=debug.js.map