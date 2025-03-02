import { UserService, MappedService } from '../types';
/**
 * MCP Mapper.
 * Responsible for mapping the parsed user service definition to an internal
 * representation suitable for code generation.
 */
declare class Mapper {
    private static instance;
    private constructor();
    /**
     * Gets the singleton instance of the Mapper.
     * @returns The Mapper instance
     */
    static getInstance(): Mapper;
    /**
     * Maps a user service to the MCP concepts.
     * @param userService The user service to map
     * @returns The mapped service ready for code generation
     */
    mapServiceToMcp(userService: UserService): MappedService;
    /**
     * Maps a user resource to an MCP resource.
     * @param resource The user resource to map
     * @returns The mapped resource
     */
    private mapResource;
    /**
     * Maps a user resource to a mapped type.
     * @param resource The user resource to map
     * @returns The mapped type
     */
    private mapResourceType;
    /**
     * Maps a user type to a mapped type.
     * @param type The user type to map
     * @returns The mapped type
     */
    private mapSupportingType;
    /**
     * Maps a user field to a mapped field.
     * @param field The user field to map
     * @returns The mapped field
     */
    private mapField;
    /**
     * Maps a type to a TypeScript type.
     * @param type The type to map
     * @param repeated Whether the type is repeated (array)
     * @returns The TypeScript type
     */
    private mapTypeToTsType;
    /**
     * Gets the TypeScript type for a given type.
     * @param type The type to map
     * @returns The TypeScript type
     */
    private getTypeScriptType;
    /**
     * Generates operations for a resource.
     * @param resource The resource
     * @returns The mapped operations
     */
    private generateOperations;
    /**
     * Gets the resource path for a resource name.
     * @param resourceName The resource name
     * @returns The resource path
     */
    private getResourcePath;
    /**
     * Pluralizes a resource name.
     * @param name The resource name
     * @returns The pluralized resource name
     */
    private pluralize;
}
export declare const mapper: Mapper;
export {};
