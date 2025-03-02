import { McpSpecification } from '../types';
/**
 * Extracts a simplified MCP specification from the schema.ts file.
 * This adapter is more flexible than the full parser and works with different schema structures.
 */
export declare function extractMcpSpecification(schemaPath: string): Promise<McpSpecification>;
