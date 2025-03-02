// Path: src/index.ts
// Main entry point for the Axe Handle code generator.

import { GeneratorOptions } from './types';
import { mcpSpecParser } from './parser/mcpSpecParser';
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { generator } from './generator/generator';

/**
 * Main function for generating an MCP server from a Protobuf schema.
 * @param options Configuration options for the generator
 */
export async function generateMcpServer(options: GeneratorOptions): Promise<void> {
  try {
    // Parse the MCP specification
    const mcpSpec = await mcpSpecParser.parseSpecification();
    
    // Parse the user service
    const userService = await serviceParser.parseService(options.inputFile, mcpSpec);
    
    // Map the user service to MCP concepts
    const mappedService = mapper.mapServiceToMcp(userService);
    
    // Generate the server code
    await generator.generateServer(mappedService, options);
    
  } catch (error) {
    throw error;
  }
}

// Export public modules
export * from './types';
export { mcpSpecParser } from './parser/mcpSpecParser';
export { serviceParser } from './parser/serviceParser';
export { generator } from './generator/generator';
export { mapper } from './mcp/mapper';