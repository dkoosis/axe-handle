// src/index.ts
import * as path from 'path';
import { Result, ResultAsync } from 'neverthrow';
import { GeneratorOptions, AxeError } from './types';
import { mcpProtocolParser } from './parser/mcpProtocolParser';
import { extractMcpProtocol } from './parser/mcpSchemaAdapter';
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { mcpServerGenerator } from './generator/mcpServerGenerator';
import { getConfigManager } from './utils/configManager';
import { getTemplateSystem } from './utils/templateSystem';
import { createAsyncErrorBoundary } from './utils/errorBoundary';
import { logger, LogCategory, LogLevel } from './utils/logger';
import { performance } from './utils/performanceUtils';
import { ValidationUtils } from './utils/validationUtils';
import { AxeResult, AxeResultAsync, okResult, errResult, createGeneratorErrorResult, runOperation, runAsyncOperation, combineResults, combineAsyncResults } from './utils/resultUtils';

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
    framework: 'express', // Default framework
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
 * Type for generation result - includes success/failure status and error if failed
 */
export interface GenerationResult {
  success: boolean;
  error?: AxeError;
}

/**
 * Result-based version of the main MCP server generator function
 */
export function generateMcpServerResult(options: GeneratorOptions): AxeResultAsync<void> {
  return runAsyncOperation(
    async () => {
      // Track generation time
      performance.start('total-generation', { options });
      
      logger.section('Axe Handle MCP Server Generator');
      
      // Validate inputs
      await ValidationUtils.validateDirectory(
        options.outputDir, 
        2001, 
        `Output directory not accessible: ${options.outputDir}`,
        true
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
      logger.success(`Service mapped successfully to MCP concepts`, LogCategory.GENERAL);
      
      // Generate the server code
      await mcpServerGenerator.generateServer(mappedService, options);
      
      // End tracking
      performance.end('total-generation');
      
      // Log summary if verbose
      if (options.verbose) {
        performance.logSummary();
      }
      
      logger.section('Generation Complete');
      logger.success(`MCP server generated successfully in ${options.outputDir}`, LogCategory.GENERAL);
    },
    'generate-mcp-server',
    2000,
    LogCategory.GENERAL
  );
}

/**
 * Main function for generating an MCP server from a Protobuf schema.
 * Wrapped with error handling for better error reporting.
 * 
 * @param options Configuration options for the generator
 */
// Export public modules and utilities
export * from './types';
export * from './utils/errorUtils';
export * from './utils/configManager';
export * from './utils/templateSystem';
export * from './utils/logger';
export * from './utils/performanceUtils';
export * from './utils/validationUtils';
export * from './utils/errorBoundary';
export * from './utils/resultUtils';
export { mcpProtocolParser } from './parser/mcpProtocolParser';
export { serviceParser } from './parser/serviceParser';
export { mcpServerGenerator } from './generator/mcpServerGenerator';
export { mapper } from './mcp/mapper';

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
    logger.success(`Service mapped successfully to MCP concepts`, LogCategory.GENERAL);
    
    // Generate the server code
    await mcpServerGenerator.generateServer(mappedService, options);
    
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