import { McpProtocol } from '../types';
/**
 * Extracts a simplified MCP protocol from the protocol.ts file.
 * This adapter is more flexible than the full parser and works with different schema structures.
 */
export declare function extractMcpProtocol(schemaPath: string): Promise<McpProtocol>;
