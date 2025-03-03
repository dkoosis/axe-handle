// Path: src/debugGenerator.ts
import * as path from 'path';
import * as fs from 'fs';
import { mapper } from './mcp/mapper';
import { serviceParser } from './parser/serviceParser';
import { mcpProtocolParser } from './parser/mcpProtocolParser';
import { extractMcpProtocol } from './parser/mcpSchemaAdapter';
import { mcpServerGenerator } from './generator/mcpServerGenerator';
import { GeneratorOptions } from './types';

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
      mcpSpec = await mcpProtocolParser.parseProtocol();
      console.log('✓ MCP protocol parsed successfully');
    } catch (error) {
      console.log('Full parser failed, trying adapter instead...');
      mcpSpec = await extractMcpProtocol(schemaPath);
      console.log('✓ MCP protocol extracted via adapter');
    }
    
    // Step 2: Parse User Service
    console.log('\nStep 2: Parsing User Service...');
    const userService = await serviceParser.parseService(schemaFile, mcpSpec);
    console.log('✓ User service parsed successfully');
    console.log(`Service name: ${userService.name}`);
    console.log(`Resources: ${userService.resources.length}`);
    console.log(`Types: ${userService.types.length}`);
    
    // Step 3: Map Service to MCP Concepts
    console.log('\nStep 3: Mapping Service to MCP Concepts...');
    const mappedService = mapper.mapServiceToMcp(userService);
    console.log('✓ Service mapped successfully');
    console.log(`Mapped resources: ${mappedService.resources.length}`);
    console.log(`Mapped types: ${mappedService.types.length}`);
    
    // Step 4: Debug Generator Internal Structure
    console.log('\nStep 4: Examining Generator Object...');
    console.log('Generator implementation:', mcpServerGenerator);
    console.log('Generator methods:', Object.getOwnPropertyNames(mcpServerGenerator));
    console.log('Generate Server implementation:', mcpServerGenerator.generateServer);
    
    // Step 5: Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }
    
    // Step 6: Generate Server Code (with detailed error capture)
    console.log('\nStep 6: Generating Server Code...');
    const options: GeneratorOptions = {
      inputFile: schemaFile,
      outputDir,
      overwrite: true,
      generateDocs: true,
      verbose: true
    };
    
    try {
      await mcpServerGenerator.generateServer(mappedService, options);
      console.log('✓ Server code generated successfully!');
    } catch (error) {
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
      } else {
        console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
      }
      throw error;
    }
  } catch (error) {
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