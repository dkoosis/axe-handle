// Path: src/parsers/modelContextProtocol/index.ts
// Result-based protocol parser

import { McpProtocol } from '@axe/schema/types';
import { mcpProtocolParser } from './protocolCache';
import { extractMcpProtocol } from './protocolAdapter';
import { createParserError } from '@utils/errorUtils';
import { logger, LogCategory } from '@utils/logger';
import { AxeResult, runAsyncOperation } from '@utils/resultUtils';
import path from 'path';

/**
* Attempts to parse the MCP protocol using the best available method.
* First tries the full parser with caching, then falls back to the adapter if that fails.
* 
* @param schemaPath Optional custom path to the protocol schema file
* @returns Promise with the parsed MCP protocol
*/
export async function parseProtocol(schemaPath?: string): Promise<McpProtocol> {
 logger.debug('Parsing MCP protocol...', LogCategory.PARSER);
 
 try {
   // Try the full parser first
   const protocol = await mcpProtocolParser.parseProtocol();
   logger.success('MCP protocol parsed successfully using full parser', LogCategory.PARSER);
   return protocol;
 } catch (error) {
   logger.warn("Full MCP parser failed, using adapter instead...", LogCategory.PARSER);
   
   // Fall back to the simpler adapter
   const defaultSchemaPath = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');
   const finalSchemaPath = schemaPath || defaultSchemaPath;
   
   try {
     const protocol = await extractMcpProtocol(finalSchemaPath);
     logger.success('MCP protocol extracted successfully using adapter', LogCategory.PARSER);
     return protocol;
   } catch (adapterError) {
     throw createParserError(
       1010,
       'Failed to parse MCP protocol using both methods',
       { schemaPath: finalSchemaPath },
       adapterError instanceof Error ? adapterError : undefined
     );
   }
 }
}

/**
* Result-based version of the protocol parser
* @param schemaPath Optional custom path to the protocol schema file
* @returns Promise with a Result containing the protocol or an error
*/
export async function parseProtocolResult(schemaPath?: string): Promise<AxeResult<McpProtocol>> {
 return runAsyncOperation(
   async () => await parseProtocol(schemaPath),
   'parse-protocol-result',
   1011,
   LogCategory.PARSER
 );
}

// Export components for direct use when needed
export { mcpProtocolParser } from './protocolCache';
export { extractMcpProtocol } from './protocolAdapter';