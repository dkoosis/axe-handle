import { McpProtocol } from '../types';
/**
 * MCP protocol Parser.
 * Responsible for parsing the MCP protocol schema and providing a cached representation.
 * Implemented as a singleton to allow caching of the parsed specification across calls.
 */
declare class mcpProtocolParser {
    private static instance;
    private constructor();
    /**
     * Gets the singleton instance of the mcpProtocolParser.
     * @returns The mcpProtocolParser instance
     */
    static getInstance(): mcpProtocolParser;
    /**
     * Parses the MCP protocol schema from the TypeScript file.
     * Tries to load from cache first, falls back to parsing from source if needed.
     */
    parseProtocol(): Promise<McpProtocol>;
    /**
     * Tries to load the MCP protocol from the cache file.
     * @returns The cached specification or null if not available
     */
    private loadFromCache;
    /**
     * Caches the parsed MCP protocol to a JSON file.
     * @param spec The MCP protocol to cache
     */
    private cacheProtocol;
    /**
     * Parses the MCP protocol from the TypeScript source file.
     * @returns The parsed MCP protocol
     */
    private parseFromSource;
    /**
     * Parses an MCP type interface to extract type definition.
     * @param node The interface declaration node
     * @returns The parsed MCP type or undefined if parsing failed
     */
    private parseTypeInterface;
    /**
     * Parses the McpCapabilities interface to extract capability definitions.
     * @param node The interface declaration node
     * @param capabilities Array to populate with parsed capabilities
     */
    private parseCapabilitiesInterface;
    /**
     * Extracts the field type from a type node.
     * @param typeNode The type node
     * @returns The field type name
     */
    private extractFieldType;
    /**
     * Determines if a type node represents a repeated (array) type.
     * @param typeNode The type node
     * @returns True if the type is an array type
     */
    private isRepeatedType;
    /**
     * Extracts the JSDoc comment for a node.
     * @param node The TypeScript node
     * @returns The JSDoc comment text or undefined if not found
     */
    private getJSDocComment;
    /**
     * Validates the parsed MCP protocol.
     * @param spec The MCP protocol to validate
     * @throws Error if the specification is invalid
     */
    private validateProtocol;
}
export declare const mcpProtocolParser: mcpProtocolParser;
export {};
