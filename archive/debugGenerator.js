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
Object.defineProperty(exports, "__esModule", { value: true });
// Path: src/debugGenerator.ts
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const mapper_1 = require("../src/mcp/mapper");
const serviceParser_1 = require("../src/parser/serviceParser");
const mcpProtocolParser_1 = require("../src/parser/mcpProtocolParser");
const mcpSchemaAdapter_1 = require("../src/parser/mcpSchemaAdapter");
const mcpServerGenerator_1 = require("../src/generator/mcpServerGenerator");
// Configure the paths
const schemaFile = path.resolve(process.cwd(), 'schemas/examples/calendar.proto');
const outputDir = path.resolve(process.cwd(), 'debug-generated');
const schemaPath = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');
async function debugGeneration() {
    console.log('=== Generator Debugging ===');
    console.log(`Schema file: ${schemaFile}`);
    console.log(`Output directory: ${outputDir}`);
    try {
        // Step 1: Parse MCP Schema
        console.log('\nStep 1: Parsing MCP Schema...');
        let mcpSpec;
        try {
            console.log('Attempting to use full MCP parser...');
            mcpSpec = await mcpProtocolParser_1.mcpProtocolParser.parseProtocol();
            console.log('✓ MCP protocol parsed successfully');
        }
        catch (error) {
            console.log('Full parser failed, trying adapter instead...');
            mcpSpec = await (0, mcpSchemaAdapter_1.extractMcpProtocol)(schemaPath);
            console.log('✓ MCP protocol extracted via adapter');
        }
        // Step 2: Parse User Service
        console.log('\nStep 2: Parsing User Service...');
        const userService = await serviceParser_1.serviceParser.parseService(schemaFile, mcpSpec);
        console.log('✓ User service parsed successfully');
        console.log(`Service name: ${userService.name}`);
        console.log(`Resources: ${userService.resources.length}`);
        console.log(`Types: ${userService.types.length}`);
        // Step 3: Map Service to MCP Concepts
        console.log('\nStep 3: Mapping Service to MCP Concepts...');
        const mappedService = mapper_1.mapper.mapServiceToMcp(userService);
        console.log('✓ Service mapped successfully');
        console.log(`Mapped resources: ${mappedService.resources.length}`);
        console.log(`Mapped types: ${mappedService.types.length}`);
        // Step 4: Debug Generator Internal Structure
        console.log('\nStep 4: Examining Generator Object...');
        console.log('Generator implementation:', mcpServerGenerator_1.mcpServerGenerator);
        console.log('Generator methods:', Object.getOwnPropertyNames(mcpServerGenerator_1.mcpServerGenerator));
        console.log('Generate Server implementation:', mcpServerGenerator_1.mcpServerGenerator.generateServer);
        // Step 5: Create output directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`Created output directory: ${outputDir}`);
        }
        // Step 6: Generate Server Code (with detailed error capture)
        console.log('\nStep 6: Generating Server Code...');
        const options = {
            inputFile: schemaFile,
            outputDir,
            overwrite: true,
            generateDocs: true,
            verbose: true
        };
        try {
            await mcpServerGenerator_1.mcpServerGenerator.generateServer(mappedService, options);
            console.log('✓ Server code generated successfully!');
        }
        catch (error) {
            console.error('Generator Error Details:');
            if (error instanceof Error) {
                console.error(`- Name: ${error.name}`);
                console.error(`- Message: ${error.message}`);
                console.error(`- Stack: ${error.stack}`);
                if (error && typeof error === 'object') {
                    // Print all properties of the error object
                    console.error('All error properties:');
                    for (const [key, value] of Object.entries(error)) {
                        console.error(`  ${key}: ${JSON.stringify(value)}`);
                    }
                }
            }
            else {
                console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
            }
            throw error;
        }
    }
    catch (error) {
        console.error('\nGenerator debugging failed:', error);
        process.exit(1);
    }
}
// Run the debug function
debugGeneration().then(() => {
    console.log('Debug completed');
}).catch(error => {
    console.error('Fatal error:', error);
});
//# sourceMappingURL=debugGenerator.js.map