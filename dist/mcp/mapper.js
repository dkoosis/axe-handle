"use strict";
// Path: src/mcp/mapper.ts
// Maps the parsed user service definition to an internal representation suitable for code generation.
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapper = void 0;
const types_1 = require("../types");
/**
 * Creates an AxeError specific to the mapper.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createMapperError(code, message, details, cause) {
    return {
        code: `${types_1.ErrorPrefix.AXE}-${types_1.AxeErrorCategory.MAPPER}${String(code).padStart(3, '0')}`,
        message,
        details,
        cause,
    };
}
/**
 * MCP Mapper.
 * Responsible for mapping the parsed user service definition to an internal
 * representation suitable for code generation.
 */
class Mapper {
    constructor() { }
    /**
     * Gets the singleton instance of the Mapper.
     * @returns The Mapper instance
     */
    static getInstance() {
        if (!Mapper.instance) {
            Mapper.instance = new Mapper();
        }
        return Mapper.instance;
    }
    /**
     * Maps a user service to the MCP concepts.
     * @param userService The user service to map
     * @param mcpSpec The MCP specification
     * @returns The mapped service ready for code generation
     */
    mapServiceToMcp(userService, mcpSpec) {
        try {
            // Map resources
            const mappedResources = userService.resources.map(resource => this.mapResource(resource, userService, mcpSpec));
            // Map types
            const mappedTypes = [
                // Map resource types
                ...userService.resources.map(resource => this.mapResourceType(resource, userService)),
                // Map supporting types
                ...userService.types.map(type => this.mapSupportingType(type, userService))
            ];
            return {
                name: userService.name,
                originalService: userService,
                resources: mappedResources,
                types: mappedTypes
            };
        }
        catch (error) {
            if (error instanceof Error && 'code' in error) {
                // Error is already an AxeError, rethrow
                throw error;
            }
            throw createMapperError(1, 'Failed to map service to MCP', { serviceName: userService.name }, error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Maps a user resource to an MCP resource.
     * @param resource The user resource to map
     * @param userService The user service
     * @param mcpSpec The MCP specification
     * @returns The mapped resource
     */
    mapResource(resource, userService, mcpSpec) {
        // Map fields
        const mappedFields = resource.fields.map(field => this.mapField(field, userService));
        // Map operations
        const mappedOperations = this.generateOperations(resource, mcpSpec);
        return {
            name: resource.name,
            description: resource.description || `${resource.name} resource`,
            operations: mappedOperations,
            fields: mappedFields
        };
    }
    /**
     * Maps a user resource to a mapped type.
     * @param resource The user resource to map
     * @param userService The user service
     * @returns The mapped type
     */
    mapResourceType(resource, userService) {
        return {
            name: resource.name,
            description: resource.description || `${resource.name} resource`,
            fields: resource.fields.map(field => this.mapField(field, userService)),
            isResource: true
        };
    }
    /**
     * Maps a user type to a mapped type.
     * @param type The user type to map
     * @param userService The user service
     * @returns The mapped type
     */
    mapSupportingType(type, userService) {
        return {
            name: type.name,
            description: type.description || `${type.name} type`,
            fields: type.fields.map(field => this.mapField(field, userService)),
            isResource: false
        };
    }
    /**
     * Maps a user field to a mapped field.
     * @param field The user field to map
     * @param userService The user service
     * @returns The mapped field
     */
    mapField(field, userService) {
        return {
            name: field.name,
            tsType: this.mapTypeToTsType(field.type, field.repeated),
            protoType: field.type,
            required: field.required,
            repeated: field.repeated,
            description: field.description || `${field.name} field`
        };
    }
    /**
     * Maps a type to a TypeScript type.
     * @param type The type to map
     * @param repeated Whether the type is repeated (array)
     * @returns The TypeScript type
     */
    mapTypeToTsType(type, repeated) {
        // Map type to TypeScript type
        const tsType = this.getTypeScriptType(type);
        // Add array syntax if repeated
        return repeated ? `${tsType}[]` : tsType;
    }
    /**
     * Gets the TypeScript type for a given type.
     * @param type The type to map
     * @returns The TypeScript type
     */
    getTypeScriptType(type) {
        // Map of Protobuf types to TypeScript types
        const typeMap = {
            'number': 'number',
            'string': 'string',
            'boolean': 'boolean',
            'Uint8Array': 'Uint8Array',
            'Date': 'Date',
            'Timestamp': 'Date'
        };
        // Check if the type is in the map
        if (typeMap[type]) {
            return typeMap[type];
        }
        // For user-defined types, return the type name
        return type;
    }
    /**
     * Generates operations for a resource.
     * @param resource The resource
     * @param mcpSpec The MCP specification
     * @returns The mapped operations
     */
    generateOperations(resource, mcpSpec) {
        const operations = [];
        const resourcePath = this.getResourcePath(resource.name);
        const resourceNameLower = resource.name.toLowerCase();
        // Generate standard CRUD operations
        operations.push({
            name: 'Get',
            httpMethod: 'GET',
            route: `${resourcePath}/:id`,
            inputType: `Get${resource.name}Request`,
            outputType: resource.name,
            description: `Get a ${resource.name} by ID`
        });
        operations.push({
            name: 'List',
            httpMethod: 'GET',
            route: resourcePath,
            inputType: `List${resource.name}Request`,
            outputType: `List${resource.name}Response`,
            description: `List ${resourceNameLower}s with pagination`
        });
        operations.push({
            name: 'Create',
            httpMethod: 'POST',
            route: resourcePath,
            inputType: `Create${resource.name}Request`,
            outputType: resource.name,
            description: `Create a new ${resource.name}`
        });
        operations.push({
            name: 'Update',
            httpMethod: 'PUT',
            route: `${resourcePath}/:id`,
            inputType: `Update${resource.name}Request`,
            outputType: resource.name,
            description: `Update an existing ${resource.name}`
        });
        operations.push({
            name: 'Delete',
            httpMethod: 'DELETE',
            route: `${resourcePath}/:id`,
            inputType: `Delete${resource.name}Request`,
            outputType: `Delete${resource.name}Response`,
            description: `Delete a ${resource.name}`
        });
        return operations;
    }
    /**
     * Gets the resource path for a resource name.
     * @param resourceName The resource name
     * @returns The resource path
     */
    getResourcePath(resourceName) {
        // Convert PascalCase to kebab-case for route paths
        const kebabCase = resourceName
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
        // Pluralize the resource name
        // This is a simplified pluralization; a real implementation would use a library
        return `/${this.pluralize(kebabCase)}`;
    }
    /**
     * Pluralizes a resource name.
     * @param name The resource name
     * @returns The pluralized resource name
     */
    pluralize(name) {
        // This is a simplified pluralization
        // In a production implementation, you would use a library like pluralize
        if (name.endsWith('s') ||
            name.endsWith('x') ||
            name.endsWith('z') ||
            name.endsWith('ch') ||
            name.endsWith('sh')) {
            return `${name}es`;
        }
        else if (name.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(name.charAt(name.length - 2))) {
            return `${name.slice(0, -1)}ies`;
        }
        else {
            return `${name}s`;
        }
    }
}
// Export the singleton instance
exports.mapper = Mapper.getInstance();
//# sourceMappingURL=mapper.js.map