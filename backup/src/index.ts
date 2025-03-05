// Path: src/index.ts
// Main entry point for the Axe Handle code generator
// Add this at the beginning of src/index.ts and src/cli.ts

import 'module-alias/register';

// For development environments, register paths directly:

import moduleAlias from 'module-alias';

moduleAlias.addAliases({
  '@axe': __dirname + '/axe',
  '@generators': __dirname + '/generators',
  '@utils': __dirname + '/utils',
  '@templates': __dirname + '/../templates'
});

// This approach will:
// 1. Work during development with ts-node
// 2. Defer to the _moduleAliases in package.json when running the built code

import { GeneratorOptions } from './types';
import { parseProtocol } from './parser/protocol';
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { mcpServerGenerator } from './generator/mcpServerGenerator';
import { getConfigManager } from './utils/configManager';
import { logger, LogCategory, LogLevel } from './utils/logger';
import { performance } from './utils/performanceUtils';
import { runAsyncOperation } from './utils/resultUtils';
import { AxeResult } from './utils/resultUtils';

/**
 * Initialize the application by setting up the template system
 * and config manager with proper paths.
 * @param options Initialization options
 */
export function initialize(options: { verbose?: boolean } = {}): void {
  // Configure logger
  logger.updateConfig({
    level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
    colors: true,
    timestamps: options.verbose
  });
  
  // Enable performance tracking if verbose
  performance.setEnabled(options.verbose || false);
  
  // Initialize the config manager
  getConfigManager();
  
  logger.debug('Application initialized', LogCategory.GENERAL);
}

/**
 * Generate an MCP server from a schema file
 * @param options Generator options
 * @returns Promise that resolves when generation is complete
 */
export async function generateMcpServer(options: GeneratorOptions): Promise<void> {
  // Initialize
  initialize({ verbose: options.verbose });
  
  try {
    // Parse MCP protocol
    const mcpProtocol = await parseProtocol();
    
    // Parse service
    const userService = await serviceParser.parseService(options.inputFile, mcpProtocol);
    
    // Map service to MCP concepts
    const mappedService = mapper.mapServiceToMcp(userService);
    
    // Generate code
    await axeServerGenerator.generateServer(mappedService, options);
    
    return;
  } catch (error) {
    logger.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
    throw error;
  }
}

/**
 * Generate an MCP server with Result-based error handling
 * @param options Generator options
 * @returns Promise that resolves to a Result
 */
export async function generateMcpServerResult(options: GeneratorOptions): Promise<AxeResult<void>> {
  return runAsyncOperation(
    async () => {
      await generateMcpServer(options);
    },
    'generate-mcp-server',
    9000,
    LogCategory.GENERATOR
  );
}

// Re-export types
export { GeneratorOptions } from './types';