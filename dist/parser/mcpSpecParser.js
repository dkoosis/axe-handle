"use strict";
// Path: src/parser/mcpProtocolParser.ts
// Parses the MCP protocol schema and provides a cached representation.
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
exports.mcpProtocolParser = void 0;
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const types_1 = require("../types");
/**
 * Path to the MCP protocol TypeScript file.
 */
const MCP_PROTOCOL_PATH = path.resolve(process.cwd(), 'schemas/mcp-spec/protocol.ts');
/**
 * Path to the cached MCP protocol JSON file.
 */
const MCP_SPEC_CACHE_PATH = path.resolve(process.cwd(), 'schemas/mcp-spec/schema.json');
/**
 * Creates an AxeError specific to the MCP protocol parser.
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
 * MCP protocol Parser.
 * Responsible for parsing the MCP protocol schema and providing a cached representation.
 * Implemented as a singleton to allow caching of the parsed specification across calls.
 */
class mcpProtocolParser {
    constructor() { }
    /**
     * Gets the singleton instance of the mcpProtocolParser.
     * @returns The mcpProtocolParser instance
     */
    static getInstance() {
        if (!mcpProtocolParser.instance) {
            mcpProtocolParser.instance = new mcpProtocolParser();
        }
        return mcpProtocolParser.instance;
    }
    /**
     * Parses the MCP protocol schema from the TypeScript file.
     * Tries to load from cache first, falls back to parsing from source if needed.
     */
    async parseProtocol() {
        try {
            // Try to load from cache first
            const cachedSpec = await this.loadFromCache();
            if (cachedSpec) {
                return cachedSpec;
            }
            // Parse from TypeScript source
            const parsedSpec = await this.parseFromSource();
            // Cache the result
            await this.cacheProtocol(parsedSpec);
            return parsedSpec;
        }
        catch (error) {
            if (error instanceof Error) {
                throw createParserError(1, 'Failed to parse MCP protocol', { path: MCP_PROTOCOL_PATH }, error);
            }
            throw error;
        }
    }
    /**
     * Tries to load the MCP protocol from the cache file.
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
                fs.stat(MCP_PROTOCOL_PATH)
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
     * Caches the parsed MCP protocol to a JSON file.
     * @param spec The MCP protocol to cache
     */
    async cacheProtocol(spec) {
        try {
            // Ensure directory exists
            const cacheDir = path.dirname(MCP_SPEC_CACHE_PATH);
            await fs.mkdir(cacheDir, { recursive: true });
            // Write cache file
            await fs.writeFile(MCP_SPEC_CACHE_PATH, JSON.stringify(spec, null, 2), 'utf-8');
        }
        catch (error) {
            // Caching failed, but we can still continue without the cache
            console.warn('Failed to cache MCP protocol:', error);
        }
    }
    /**
     * Parses the MCP protocol from the TypeScript source file.
     * @returns The parsed MCP protocol
     */
    async parseFromSource() {
        // Read TypeScript source
        const sourceText = await fs.readFile(MCP_PROTOCOL_PATH, 'utf-8');
        // Create TypeScript program
        const fileName = MCP_PROTOCOL_PATH;
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
                        declaration.name.text === 'LATEST_PROTOCOL_VERSION' &&
                        declaration.initializer &&
                        ts.isStringLiteral(declaration.initializer)) {
                        spec.version = declaration.initializer.text;
                    }
                });
            }
            // Look for interface declarations
            if (ts.isInterfaceDeclaration(node)) {
                const interfaceName = node.name.text;
                // Look for Request interfaces to determine available operations
                if (interfaceName.endsWith('Request') &&
                    !interfaceName.includes('JSON') &&
                    !interfaceName.includes('Paginated')) {
                    const operation = {
                        name: interfaceName.replace('Request', ''),
                        description: this.getJSDocComment(node) || `MCP ${interfaceName.replace('Request', '')} operation`,
                        inputType: interfaceName,
                        outputType: interfaceName.replace('Request', 'Result'),
                        required: true
                    };
                    spec.operations.push(operation);
                }
                // Parse MCP types
                if (interfaceName.endsWith('Type') && interfaceName !== 'McpType') {
                    const mcpType = this.parseTypeInterface(node);
                    if (mcpType) {
                        spec.types.push(mcpType);
                    }
                }
                // Parse MCP capabilities
                if (interfaceName === 'ServerCapabilities' || interfaceName === 'ClientCapabilities') {
                    this.parseCapabilitiesInterface(node, spec.capabilities);
                }
            }
        });
        // Validate the parsed specification
        this.validateProtocol(spec);
        return spec;
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
                // Fix the type issue with the comment property
                return jsDocComment.comment;
            }
        }
        return undefined;
    }
    /**
     * Validates the parsed MCP protocol.
     * @param spec The MCP protocol to validate
     * @throws Error if the specification is invalid
     */
    validateProtocol(spec) {
        // Check for required components
        if (spec.operations.length === 0) {
            throw createParserError(2, 'MCP protocol does not define any operations', { path: MCP_PROTOCOL_PATH });
        }
        if (spec.types.length === 0) {
            // Instead of throwing an error, add some basic types
            spec.types.push({
                name: 'String',
                description: 'String type',
                fields: []
            });
            spec.types.push({
                name: 'Number',
                description: 'Number type',
                fields: []
            });
            spec.types.push({
                name: 'Boolean',
                description: 'Boolean type',
                fields: []
            });
            console.warn('Warning: No types found in MCP protocol, using basic types');
        }
        // Check for required operations
        if (spec.operations.length === 0) {
            throw createParserError(4, 'MCP protocol does not define any operations', { path: MCP_PROTOCOL_PATH });
        }
        // Some basic CRUD operations should be available
        const basicOperations = ['Get', 'List', 'Create', 'Update', 'Delete'];
        const foundBasicOps = basicOperations.filter(op => spec.operations.some(specOp => specOp.name.includes(op)));
        if (foundBasicOps.length === 0) {
            console.warn(`Warning: No basic CRUD operations found in MCP protocol`);
        }
        // Check for required capabilities
        if (spec.capabilities.length === 0) {
            // Add default capabilities instead of throwing an error
            spec.capabilities.push({
                name: 'resources',
                description: 'Server can provide resources',
                required: false
            });
            spec.capabilities.push({
                name: 'tools',
                description: 'Server can provide tools',
                required: false
            });
            console.warn('Warning: No capabilities found in MCP protocol, using default capabilities');
        }
    }
}
// Export the singleton instance
exports.mcpProtocolParser = mcpProtocolParser.getInstance();
//# sourceMappingURL=mcpProtocolParser.js.map