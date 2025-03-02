"use strict";
// Path: src/parser/mcpSpecParser.ts
// Parses the MCP specification schema and provides a cached representation.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpSpecParser = void 0;
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const types_1 = require("../types");
/**
 * Path to the MCP specification TypeScript file.
 */
const MCP_SPEC_PATH = path.resolve(__dirname, '../../../schemas/mcp-spec/schema.ts');
/**
 * Path to the cached MCP specification JSON file.
 */
const MCP_SPEC_CACHE_PATH = path.resolve(__dirname, '../../../schemas/mcp-spec/schema.json');
/**
 * Creates an AxeError specific to the MCP specification parser.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createParserError(code, message, details, cause) {
    return {
        code: `${types_1.ErrorPrefix.AXE}-${types_1.AxeErrorCategory.PARSER}${String(code).padStart(3, '0')}`,
        message,
        details,
        cause,
    };
}
/**
 * MCP Specification Parser.
 * Responsible for parsing the MCP specification schema and providing a cached representation.
 * Implemented as a singleton to allow caching of the parsed specification across calls.
 */
class McpSpecParser {
    constructor() { }
    /**
     * Gets the singleton instance of the McpSpecParser.
     * @returns The McpSpecParser instance
     */
    static getInstance() {
        if (!McpSpecParser.instance) {
            McpSpecParser.instance = new McpSpecParser();
        }
        return McpSpecParser.instance;
    }
    /**
     * Parses the MCP specification schema from the TypeScript file.
     * Tries to load from cache first, falls back to parsing from source if needed.
     */
    async parseSpecification() {
        try {
            // Try to load from cache first
            const cachedSpec = await this.loadFromCache();
            if (cachedSpec) {
                return cachedSpec;
            }
            // Parse from TypeScript source
            const parsedSpec = await this.parseFromSource();
            // Cache the result
            await this.cacheSpecification(parsedSpec);
            return parsedSpec;
        }
        catch (error) {
            if (error instanceof Error) {
                throw createParserError(1, 'Failed to parse MCP specification', { path: MCP_SPEC_PATH }, error);
            }
            throw error;
        }
    }
    /**
     * Tries to load the MCP specification from the cache file.
     * @returns The cached specification or null if not available
     */
    async loadFromCache() {
        try {
            // Check if cache exists
            try {
                await fs.access(MCP_SPEC_CACHE_PATH);
            }
            catch {
                return null;
            }
            // Check if cache is newer than source
            const [cacheStats, sourceStats] = await Promise.all([
                fs.stat(MCP_SPEC_CACHE_PATH),
                fs.stat(MCP_SPEC_PATH)
            ]);
            if (cacheStats.mtime <= sourceStats.mtime) {
                return null; // Cache is older than source
            }
            // Load cache
            const cacheContent = await fs.readFile(MCP_SPEC_CACHE_PATH, 'utf-8');
            const cachedSpec = JSON.parse(cacheContent);
            return cachedSpec;
        }
        catch (error) {
            // Cache loading failed, return null to trigger parsing from source
            return null;
        }
    }
    /**
     * Caches the parsed MCP specification to a JSON file.
     * @param spec The MCP specification to cache
     */
    async cacheSpecification(spec) {
        try {
            // Ensure directory exists
            const cacheDir = path.dirname(MCP_SPEC_CACHE_PATH);
            await fs.mkdir(cacheDir, { recursive: true });
            // Write cache file
            await fs.writeFile(MCP_SPEC_CACHE_PATH, JSON.stringify(spec, null, 2), 'utf-8');
        }
        catch (error) {
            // Caching failed, but we can still continue without the cache
            console.warn('Failed to cache MCP specification:', error);
        }
    }
    /**
     * Parses the MCP specification from the TypeScript source file.
     * @returns The parsed MCP specification
     */
    async parseFromSource() {
        // Read TypeScript source
        const sourceText = await fs.readFile(MCP_SPEC_PATH, 'utf-8');
        // Create TypeScript program
        const fileName = MCP_SPEC_PATH;
        const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
        // Initialize specification
        const spec = {
            version: '1.0.0', // Default version, will be updated if found in source
            operations: [],
            types: [],
            capabilities: []
        };
        // Visit each node in the source file
        ts.forEachChild(sourceFile, (node) => {
            // Look for version declaration
            if (ts.isVariableStatement(node)) {
                node.declarationList.declarations.forEach(declaration => {
                    if (ts.isIdentifier(declaration.name) &&
                        declaration.name.text === 'MCP_VERSION' &&
                        declaration.initializer &&
                        ts.isStringLiteral(declaration.initializer)) {
                        spec.version = declaration.initializer.text;
                    }
                });
            }
            // Look for interface declarations
            if (ts.isInterfaceDeclaration(node)) {
                const interfaceName = node.name.text;
                // Parse MCP operations
                if (interfaceName === 'McpOperations') {
                    this.parseOperationsInterface(node, spec.operations);
                }
                // Parse MCP types
                if (interfaceName.endsWith('Type') && interfaceName !== 'McpType') {
                    const mcpType = this.parseTypeInterface(node);
                    if (mcpType) {
                        spec.types.push(mcpType);
                    }
                }
                // Parse MCP capabilities
                if (interfaceName === 'McpCapabilities') {
                    this.parseCapabilitiesInterface(node, spec.capabilities);
                }
            }
        });
        // Validate the parsed specification
        this.validateSpecification(spec);
        return spec;
    }
    /**
     * Parses the McpOperations interface to extract operation definitions.
     * @param node The interface declaration node
     * @param operations Array to populate with parsed operations
     */
    parseOperationsInterface(node, operations) {
        node.members.forEach(member => {
            if (ts.isPropertySignature(member) && member.type && ts.isTypeReferenceNode(member.type)) {
                const operationName = member.name.getText().replace(/['"]/g, '');
                const operationType = member.type.typeName.getText();
                const description = this.getJSDocComment(member);
                const operation = {
                    name: operationName,
                    description: description || `MCP ${operationName} operation`,
                    inputType: this.extractInputType(member.type),
                    outputType: this.extractOutputType(member.type),
                    required: member.questionToken === undefined
                };
                operations.push(operation);
            }
        });
    }
    /**
     * Parses an MCP type interface to extract type definition.
     * @param node The interface declaration node
     * @returns The parsed MCP type or undefined if parsing failed
     */
    parseTypeInterface(node) {
        const typeName = node.name.text;
        const description = this.getJSDocComment(node);
        const fields = [];
        node.members.forEach(member => {
            if (ts.isPropertySignature(member)) {
                const fieldName = member.name.getText().replace(/['"]/g, '');
                const fieldDescription = this.getJSDocComment(member);
                const isRepeated = this.isRepeatedType(member.type);
                const field = {
                    name: fieldName,
                    type: this.extractFieldType(member.type),
                    required: member.questionToken === undefined,
                    repeated: isRepeated,
                    description: fieldDescription || `${fieldName} field`
                };
                fields.push(field);
            }
        });
        if (fields.length === 0) {
            return undefined; // Skip empty types
        }
        return {
            name: typeName,
            description: description || `MCP ${typeName}`,
            fields
        };
    }
    /**
     * Parses the McpCapabilities interface to extract capability definitions.
     * @param node The interface declaration node
     * @param capabilities Array to populate with parsed capabilities
     */
    parseCapabilitiesInterface(node, capabilities) {
        node.members.forEach(member => {
            if (ts.isPropertySignature(member)) {
                const capabilityName = member.name.getText().replace(/['"]/g, '');
                const description = this.getJSDocComment(member);
                const capability = {
                    name: capabilityName,
                    description: description || `MCP ${capabilityName} capability`,
                    required: member.questionToken === undefined
                };
                capabilities.push(capability);
            }
        });
    }
    /**
     * Extracts the input type from an operation type reference.
     * @param typeNode The type reference node
     * @returns The input type name
     */
    extractInputType(typeNode) {
        if (typeNode.typeArguments && typeNode.typeArguments.length > 0) {
            return typeNode.typeArguments[0].getText();
        }
        return 'any';
    }
    /**
     * Extracts the output type from an operation type reference.
     * @param typeNode The type reference node
     * @returns The output type name
     */
    extractOutputType(typeNode) {
        if (typeNode.typeArguments && typeNode.typeArguments.length > 1) {
            return typeNode.typeArguments[1].getText();
        }
        return 'any';
    }
    /**
     * Extracts the field type from a type node.
     * @param typeNode The type node
     * @returns The field type name
     */
    extractFieldType(typeNode) {
        if (!typeNode) {
            return 'any';
        }
        // Handle array types
        if (this.isRepeatedType(typeNode)) {
            if (ts.isArrayTypeNode(typeNode)) {
                return this.extractFieldType(typeNode.elementType);
            }
            else if (ts.isTypeReferenceNode(typeNode) &&
                typeNode.typeName.getText() === 'Array' &&
                typeNode.typeArguments &&
                typeNode.typeArguments.length > 0) {
                return this.extractFieldType(typeNode.typeArguments[0]);
            }
        }
        // Handle regular types
        if (ts.isTypeReferenceNode(typeNode)) {
            return typeNode.typeName.getText();
        }
        // Handle union types
        if (ts.isUnionTypeNode(typeNode)) {
            // For simplicity, use the first type in the union
            return this.extractFieldType(typeNode.types[0]);
        }
        // Handle primitive types
        return typeNode.getText();
    }
    /**
     * Determines if a type node represents a repeated (array) type.
     * @param typeNode The type node
     * @returns True if the type is an array type
     */
    isRepeatedType(typeNode) {
        if (!typeNode) {
            return false;
        }
        if (ts.isArrayTypeNode(typeNode)) {
            return true;
        }
        if (ts.isTypeReferenceNode(typeNode) &&
            typeNode.typeName.getText() === 'Array' &&
            typeNode.typeArguments &&
            typeNode.typeArguments.length > 0) {
            return true;
        }
        return false;
    }
    /**
     * Extracts the JSDoc comment for a node.
     * @param node The TypeScript node
     * @returns The JSDoc comment text or undefined if not found
     */
    getJSDocComment(node) {
        const jsDocComments = ts.getJSDocCommentsAndTags(node);
        if (jsDocComments && jsDocComments.length > 0) {
            const jsDocComment = jsDocComments[0];
            if (ts.isJSDoc(jsDocComment)) {
                return jsDocComment.comment;
            }
        }
        return undefined;
    }
    /**
     * Validates the parsed MCP specification.
     * @param spec The MCP specification to validate
     * @throws Error if the specification is invalid
     */
    validateSpecification(spec) {
        // Check for required components
        if (spec.operations.length === 0) {
            throw createParserError(2, 'MCP specification does not define any operations', { path: MCP_SPEC_PATH });
        }
        if (spec.types.length === 0) {
            throw createParserError(3, 'MCP specification does not define any types', { path: MCP_SPEC_PATH });
        }
        // Check for required operations
        const requiredOperations = ['Get', 'List', 'Create', 'Update', 'Delete'];
        for (const requiredOp of requiredOperations) {
            if (!spec.operations.some(op => op.name === requiredOp)) {
                throw createParserError(4, `MCP specification is missing required operation: ${requiredOp}`, { path: MCP_SPEC_PATH });
            }
        }
        // Check for required capabilities
        if (spec.capabilities.length === 0) {
            throw createParserError(5, 'MCP specification does not define any capabilities', { path: MCP_SPEC_PATH });
        }
    }
}
// Export the singleton instance
exports.mcpSpecParser = McpSpecParser.getInstance();
//# sourceMappingURL=mcpSpecParser.js.map