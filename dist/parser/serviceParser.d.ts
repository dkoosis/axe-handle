import { UserService, McpSpecification } from '../types';
/**
 * Service Parser.
 * Responsible for parsing user-provided Protobuf service definitions
 * and validating them against the MCP specification.
 */
declare class ServiceParser {
    private static instance;
    private constructor();
    /**
     * Gets the singleton instance of the ServiceParser.
     * @returns The ServiceParser instance
     */
    static getInstance(): ServiceParser;
    /**
     * Parses a Protobuf service definition and validates it against the MCP specification.
     * @param filePath Path to the Protobuf file
     * @param mcpSpec The MCP specification to validate against
     * @returns The parsed user service
     */
    parseService(filePath: string, mcpSpec: McpSpecification): Promise<UserService>;
    /**
     * Extracts the service name from the file path.
     * @param filePath Path to the Protobuf file
     * @returns The service name
     */
    private extractServiceName;
    /**
     * Extracts resources and types from the Protobuf root.
     * @param root The Protobuf root
     * @returns The extracted resources and types
     */
    private extractResourcesAndTypes;
    /**
     * Gets all message types from the Protobuf root.
     * @param root The Protobuf root
     * @returns Array of message types
     */
    private getAllMessageTypes;
    /**
     * Determines if a message type is a resource.
     * Resources are top-level message types that are expected to have CRUD operations.
     * @param messageType The message type
     * @returns True if the message type is a resource
     */
    private isResource;
    /**
     * Converts a Protobuf message to a user resource.
     * @param messageType The message type
     * @returns The user resource
     */
    private convertMessageToResource;
    /**
     * Converts a Protobuf message to a user type.
     * @param messageType The message type
     * @returns The user type
     */
    private convertMessageToType;
    /**
     * Extracts fields from a Protobuf message.
     * @param messageType The message type
     * @returns Array of user fields
     */
    private extractFields;
    /**
     * Converts a Protobuf type to a type name.
     * @param protoType The Protobuf type
     * @param resolvedType The resolved type (for message references)
     * @returns The type name
     */
    private convertProtoTypeToTypeName;
    /**
     * Extracts comments from Protobuf options.
     * @param options The Protobuf options object
     * @returns The extracted comment or a default description
     */
    private extractCommentFromOptions;
    /**
     * Validates the user service against the MCP specification.
     * @param userService The user service to validate
     * @param mcpSpec The MCP specification
     * @param filePath Path to the Protobuf file (for error messages)
     * @throws Error if the service is invalid
     */
    private validateUserService;
    /**
     * Validates a field type against the MCP specification.
     * @param field The field to validate
     * @param userService The user service
     * @param mcpSpec The MCP specification
     * @param filePath Path to the Protobuf file (for error messages)
     * @throws Error if the field type is invalid
     */
    private validateFieldType;
}
export declare const serviceParser: ServiceParser;
export {};
