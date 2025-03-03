// Path: src/index.ts
// Main entry point for the Axe Handle code generator.

import * as path from 'path';
import { GeneratorOptions } from './types';
import { mcpProtocolParser } from './parser/mcpProtocolParser';
import { extractMcpProtocol } from './parser/mcpSchemaAdapter';
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { generator } from './generator/mcpServerGenerator';
import { getConfigManager } from './utils/configManager';
import { getTemplateManager } from './utils/templateManager';
import { createCliError, withErrorHandling } from './utils/errorUtils';

/**
 * Initialize the application by setting up the template manager
 * and config manager with proper paths.
 */
export function initialize(): void {
  // Initialize the template manager with the default templates directory
  const templatesDir = path.resolve(__dirname, '../templates');
  getTemplateManager(templatesDir);
  
  // Initialize the config manager (no action needed, just ensures it's created)
  getConfigManager();
}

/**
 * Main function for generating an MCP server from a Protobuf schema.
 * Wrapped with error handling for better error reporting.
 * 
 * @param options Configuration options for the generator
 */
export const generateMcpServer = withErrorHandling(
  async (options: GeneratorOptions): Promise<void> => {
    // Initialize the application
    initialize();
    
    // Load configuration file if provided
    const configManager = getConfigManager();
    if (options.configFile) {
      await configManager.loadConfigFile(options.configFile);
    }
    
    // Update configuration with options
    configManager.updateConfig({
      // Add any configuration from options
      // For now, we're just setting up the infrastructure
    });
    
    // Parse the MCP protocol
    const schemaPath = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');
    let mcpSpec;
    try {
      // Try the full parser first
      mcpSpec = await mcpProtocolParser.parseProtocol();
    } catch (error) {
      console.log("Full MCP parser failed, using adapter instead...");
      // Fall back to the simpler adapter
      mcpSpec = await extractMcpProtocol(schemaPath);
    }
    
    // Parse the user service
    const userService = await serviceParser.parseService(options.inputFile, mcpSpec);
    
    // Map the user service to MCP concepts
    const mappedService = mapper.mapServiceToMcp(userService);
    
    // Generate the server code
    await generator.generateServer(mappedService, options);
  },
  createCliError
);

// Export public modules and utilities
export * from './types';
export * from './utils/errorUtils';
export * from './utils/configManager';
export * from './utils/templateManager';
export { mcpProtocolParser } from './parser/mcpProtocolParser';
export { serviceParser } from './parser/serviceParser';
export { generator } from './generator/mcpServerGenerator';
export { mapper } from './mcp/mapper';
