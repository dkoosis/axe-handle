/**
 * Represents a TypeScript interface definition parsed from the MCP schema.
 */
export interface MCPInterface {
    /** Name of the interface */
    name: string;
    /** Description of the interface from JSDoc */
    description?: string;
    /** Properties of the interface */
    properties: MCPProperty[];
    /** Extends clauses of the interface */
    extends: string[];
}
/**
 * Represents a TypeScript property in an interface.
 */
export interface MCPProperty {
    /** Name of the property */
    name: string;
    /** Type of the property */
    type: MCPType;
    /** Whether the property is optional */
    optional: boolean;
    /** Description of the property from JSDoc */
    description?: string;
    /** JSDoc tags on the property */
    tags?: Record<string, string>;
}
/**
 * Represents a TypeScript type.
 */
export type MCPType = MCPPrimitiveType | MCPArrayType | MCPUnionType | MCPIntersectionType | MCPTypeReference | MCPIndexedType | MCPObjectType | MCPLiteralType;
/**
 * Represents a primitive TypeScript type.
 */
export interface MCPPrimitiveType {
    kind: 'primitive';
    /** The primitive type name */
    name: 'string' | 'number' | 'boolean' | 'any' | 'unknown' | 'void' | 'undefined' | 'null' | 'never';
}
/**
 * Represents an array type.
 */
export interface MCPArrayType {
    kind: 'array';
    /** The element type of the array */
    elementType: MCPType;
}
/**
 * Represents a union type.
 */
export interface MCPUnionType {
    kind: 'union';
    /** The types in the union */
    types: MCPType[];
}
/**
 * Represents an intersection type.
 */
export interface MCPIntersectionType {
    kind: 'intersection';
    /** The types in the intersection */
    types: MCPType[];
}
/**
 * Represents a reference to another type.
 */
export interface MCPTypeReference {
    kind: 'reference';
    /** The name of the referenced type */
    name: string;
    /** Type arguments for generic type references */
    typeArguments?: MCPType[];
}
/**
 * Represents an indexed access type.
 */
export interface MCPIndexedType {
    kind: 'indexed';
    /** The object type being indexed */
    objectType: MCPType;
    /** The index type */
    indexType: MCPType;
}
/**
 * Represents an object type literal.
 */
export interface MCPObjectType {
    kind: 'object';
    /** Properties of the object type */
    properties: MCPProperty[];
}
/**
 * Represents a literal type.
 */
export interface MCPLiteralType {
    kind: 'literal';
    /** The value of the literal */
    value: string | number | boolean;
}
/**
 * Represents a TypeScript type alias definition.
 */
export interface MCPTypeAlias {
    /** Name of the type alias */
    name: string;
    /** Description of the type alias from JSDoc */
    description?: string;
    /** Type parameters of the type alias */
    typeParameters: string[];
    /** Type represented by the alias */
    type: MCPType;
}
/**
 * Represents a TypeScript enum definition.
 */
export interface MCPEnum {
    /** Name of the enum */
    name: string;
    /** Description of the enum from JSDoc */
    description?: string;
    /** Members of the enum */
    members: MCPEnumMember[];
}
/**
 * Represents a member of a TypeScript enum.
 */
export interface MCPEnumMember {
    /** Name of the enum member */
    name: string;
    /** Value of the enum member */
    value: string | number;
    /** Description of the enum member from JSDoc */
    description?: string;
}
/**
 * Represents a TypeScript constant definition.
 */
export interface MCPConstant {
    /** Name of the constant */
    name: string;
    /** Type of the constant */
    type: MCPType;
    /** Value of the constant */
    value: string | number | boolean;
    /** Description of the constant from JSDoc */
    description?: string;
}
/**
 * Result of analyzing an MCP schema.
 */
export interface SchemaAnalysisResult {
    /** Version of the MCP protocol */
    version: string;
    /** Interfaces defined in the schema */
    interfaces: Record<string, MCPInterface>;
    /** Type aliases defined in the schema */
    types: Record<string, MCPTypeAlias>;
    /** Enums defined in the schema */
    enums: Record<string, MCPEnum>;
    /** Constants defined in the schema */
    constants: Record<string, MCPConstant>;
    /** Summary statistics */
    summary: {
        /** Number of interfaces */
        interfaceCount: number;
        /** Number of type aliases */
        typeCount: number;
        /** Number of enums */
        enumCount: number;
        /** Number of constants */
        constantCount: number;
    };
}
