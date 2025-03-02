import { McpSpecification } from '../types';
/**
 * MCP Specification Parser.
 * Responsible for parsing the MCP specification schema and providing a cached representation.
 * Implemented as a singleton to allow caching of the parsed specification across calls.
 */
declare class McpSpecParser {
    private static instance;
    private constructor();
    /**
     * Gets the singleton instance of the McpSpecParser.
     * @returns The McpSpecParser instance
     */
    static getInstance(): McpSpecParser;
    /**
     * Parses the MCP specification schema from the TypeScript file.
     * Tries to load from cache first, falls back to parsing from source if needed.
     */
    parseSpecification(): Promise<McpSpecification>;
    /**
     * Tries to load the MCP specification from the cache file.
     * @returns The cached specification or null if not available
     */
    private loadFromCache;
    /**
     * Caches the parsed MCP specification to a JSON file.
     * @param spec The MCP specification to cache
     */
    private cacheSpecification;
    /**
     * Parses the MCP specification from the TypeScript source file.
     * @returns The parsed MCP specification
     */
    private parseFromSource;
    /**
     * Parses the McpOperations interface to extract operation definitions.
     * @param node The interface declaration node
     * @param operations Array to populate with parsed operations
     */
    private parseOperationsInterface;
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
     * Extracts the input type from an operation type reference.
     * @param typeNode The type reference node
     * @returns The input type name
     */
    private extractInputType;
    /**
     * Extracts the output type from an operation type reference.
     * @param typeNode The type reference node
     * @returns The output type name
     */
    private extractOutputType;
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
     * Validates the parsed MCP specification.
     * @param spec The MCP specification to validate
     * @throws Error if the specification is invalid
     */
    private validateSpecification;
}
export declare const mcpSpecParser: McpSpecParser;
export {};
