// src/index.ts
import * as path from 'path';
import { GeneratorOptions } from './types';
import { mcpProtocolParser } from './parser/mcpProtocolParser';
import { extractMcpProtocol } from './parser/mcpSchemaAdapter';
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { generator } from './generator/generator';
import { getConfigManager } from './utils/configManager';
import { getTemplateSystem } from './utils/templateSystem';
import { createCliError } from './utils/errorUtils';
import { createAsyncErrorBoundary } from './utils/errorBoundary';
import { logger, LogCategory, LogLevel } from './utils/logger';
import { performance } from './utils/performanceUtils';
import { ValidationUtils } from './utils/validationUtils';

/**
 * Initialize the application by setting up the template system
 * and config manager with proper paths.
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
  
  // Initialize the template system with the default templates directory
  const templatesDir = path.resolve(__dirname, '../templates');
  getTemplateSystem({
    baseDir: templatesDir,
    cache: true,
    helpers: {
      // Register common helpers
      isRequestType: (type: string) => type.endsWith('Request'),
      isResponseType: (type: string) => type.endsWith('Result') || type.endsWith('Response'),
      getResponseTypeForRequest: (requestType: string) => requestType.replace('Request', 'Result'),
      getMethodFromRequest: (requestType: string) => {
        const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
        return methodParts.map(part => part.toLowerCase()).join('_');
      }
    }
  });
  
  // Initialize the config manager (no action needed, just ensures it's created)
  getConfigManager();
  
  logger.debug('Application initialized', LogCategory.GENERAL);
}

/**
 * Main function for generating an MCP server from a Protobuf schema.
 * Wrapped with error handling for better error reporting.
 * 
 * @param options Configuration options for the generator
 */
export const generateMcpServer = createAsyncErrorBoundary(
  async (options: GeneratorOptions): Promise<void> => {
    // Track generation time
    performance.start('total-generation', { options });
    
    logger.section('Axe Handle MCP Server Generator');
    
    // Validate inputs
    await ValidationUtils.validateFile(
      options.inputFile, 
      2001,
      `Input file not found or not readable: ${options.inputFile}`
    );
    
    // Initialize the application
    initialize({ verbose: options.verbose });
    
    // Load configuration file if provided
    const configManager = getConfigManager();
    if (options.configFile) {
      await configManager.loadConfigFile(options.configFile);
    }
    
    // Parse the MCP protocol
    logger.section('Parsing MCP Protocol');
    
    let mcpSpec;
    try {
      // Try the full parser first
      mcpSpec = await mcpProtocolParser.parseProtocol();
      logger.success('MCP protocol parsed successfully using full parser', LogCategory.PARSER);
    } catch (error) {
      logger.warn("Full MCP parser failed, using adapter instead...", LogCategory.PARSER);
      // Fall back to the simpler adapter
      const schemaPath = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');
      mcpSpec = await extractMcpProtocol(schemaPath);
      logger.success('MCP protocol extracted successfully using adapter', LogCategory.PARSER);
    }
    
    // Parse the user service
    logger.section('Parsing User Service');
    logger.info(`Parsing service from ${options.inputFile}`, LogCategory.PARSER);
    
    const userService = await serviceParser.parseService(options.inputFile, mcpSpec);
    logger.success(`Service "${userService.name}" parsed successfully`, LogCategory.PARSER);
    logger.info(`Found ${userService.resources.length} resources and ${userService.types.length} types`, LogCategory.PARSER);
    
    // Map the user service to MCP concepts
    logger.section('Mapping Service to MCP');
    const mappedService = mapper.mapServiceToMcp(userService);
    logger.success(`Service mapped successfully to MCP concepts`, LogCategory.MAPPER);
    
    // Generate the server code
    await generator.generateServer(mappedService, options);
    
    // End tracking
    performance.end('total-generation');
    
    // Log summary if verbose
    if (options.verbose) {
      performance.logSummary();
    }
    
    logger.section('Generation Complete');
    logger.success(`MCP server generated successfully in ${options.outputDir}`, LogCategory.GENERAL);
  },
  {
    operation: 'generate-mcp-server',
    category: LogCategory.GENERAL,
    errorCode: 2000
  }
);

// Export public modules and utilities
export * from './types';
export * from './utils/errorUtils';
export * from './utils/configManager';
export * from './utils/templateSystem';
export * from './utils/logger';
export * from './utils/performanceUtils';
export * from './utils/validationUtils';
export * from './utils/errorBoundary';
export { mcpProtocolParser } from './parser/mcpProtocolParser';
export { serviceParser } from './parser/serviceParser';
export { generator } from './generator/generator';
export { mapper } from './mcp/mapper';