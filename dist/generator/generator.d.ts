import { MappedService, GeneratorOptions } from '../types';
/**
 * Code Generator.
 * Responsible for generating TypeScript code for the MCP server
 * based on the mapped service definition.
 */
declare class Generator {
    private static instance;
    private templatesDir;
    private constructor();
    /**
     * Gets the singleton instance of the Generator.
     * @returns The Generator instance
     */
    static getInstance(): Generator;
    /**
     * Generates server code for the mapped service.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    generateServer(mappedService: MappedService, options: GeneratorOptions): Promise<void>;
    /**
     * Generates the types file.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    private generateTypesFile;
    /**
     * Generates handler files for each resource.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    private generateHandlerFiles;
    /**
     * Generates the server file.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    private generateServerFile;
    /**
     * Generates the index file.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    private generateIndexFile;
    /**
     * Generates documentation.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    private generateDocumentation;
    /**
     * Converts a camelCase string to kebab-case.
     * @param str The string to convert
     * @returns The converted string
     */
    private camelToKebabCase;
}
export declare const generator: Generator;
export {};
