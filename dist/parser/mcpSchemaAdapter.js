"use strict";
// Path: src/parser/mcpSchemaAdapter.ts
// Creates a simplified MCP specification from schema.ts
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
exports.extractMcpSpecification = extractMcpSpecification;
const fs = __importStar(require("fs/promises"));
const ts = __importStar(require("typescript"));
const errorUtils_1 = require("../utils/errorUtils");
/**
 * Extracts a simplified MCP specification from the schema.ts file.
 * This adapter is more flexible than the full parser and works with different schema structures.
 */
async function extractMcpSpecification(schemaPath) {
    try {
        // Read the schema file
        const schemaContent = await fs.readFile(schemaPath, 'utf-8');
        // Parse the TypeScript content
        const sourceFile = ts.createSourceFile(schemaPath, schemaContent, ts.ScriptTarget.Latest, true);
        // Initialize the specification
        const spec = {
            version: '1.0.0', // Default version
            operations: [],
            types: [],
            capabilities: []
        };
        // Find the protocol version
        const versionDeclaration = findVersionDeclaration(sourceFile);
        if (versionDeclaration) {
            spec.version = versionDeclaration;
        }
        // Extract operations from Request interfaces
        const requestInterfaces = findRequestInterfaces(sourceFile);
        for (const reqInterface of requestInterfaces) {
            const operationName = reqInterface.replace('Request', '');
            spec.operations.push({
                name: operationName,
                description: `MCP ${operationName} operation`,
                inputType: reqInterface,
                outputType: reqInterface.replace('Request', 'Result'),
                required: false
            });
        }
        // Extract types from other interfaces
        const typeInterfaces = findTypeInterfaces(sourceFile, requestInterfaces);
        for (const typeInterface of typeInterfaces) {
            spec.types.push({
                name: typeInterface,
                description: `MCP ${typeInterface} type`,
                fields: [] // We're simplifying by not extracting fields
            });
        }
        // Add basic capabilities
        spec.capabilities.push({
            name: 'resources',
            description: 'Server provides resources',
            required: false
        });
        spec.capabilities.push({
            name: 'tools',
            description: 'Server provides tools',
            required: false
        });
        // Perform basic validation
        if (spec.operations.length === 0) {
            throw (0, errorUtils_1.createParserError)(1002, 'Failed to extract any operations from MCP schema', { schemaPath });
        }
        return spec;
    }
    catch (error) {
        if (error instanceof Error && 'code' in error) {
            throw error; // Rethrow existing AxeError
        }
        throw (0, errorUtils_1.createParserError)(1001, 'Failed to extract MCP specification', { schemaPath }, error instanceof Error ? error : undefined);
    }
}
/**
 * Finds the protocol version declaration in the source file.
 */
function findVersionDeclaration(sourceFile) {
    let version;
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
            node.declarationList.declarations.forEach(declaration => {
                if (ts.isIdentifier(declaration.name) &&
                    (declaration.name.text === 'MCP_VERSION' || declaration.name.text === 'LATEST_PROTOCOL_VERSION') &&
                    declaration.initializer &&
                    ts.isStringLiteral(declaration.initializer)) {
                    version = declaration.initializer.text;
                }
            });
        }
    });
    return version;
}
/**
 * Finds all Request interfaces in the source file.
 */
function findRequestInterfaces(sourceFile) {
    const requestInterfaces = [];
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node)) {
            const interfaceName = node.name.text;
            if (interfaceName.endsWith('Request') && !interfaceName.startsWith('JSON')) {
                requestInterfaces.push(interfaceName);
            }
        }
    });
    return requestInterfaces;
}
/**
 * Finds all type interfaces (excluding request interfaces) in the source file.
 */
function findTypeInterfaces(sourceFile, requestInterfaces) {
    const typeInterfaces = [];
    ts.forEachChild(sourceFile, (node) => {
        if (ts.isInterfaceDeclaration(node)) {
            const interfaceName = node.name.text;
            if (!interfaceName.endsWith('Request') &&
                !interfaceName.endsWith('Response') &&
                !interfaceName.endsWith('Notification') &&
                !requestInterfaces.includes(interfaceName)) {
                typeInterfaces.push(interfaceName);
            }
        }
    });
    return typeInterfaces;
}
//# sourceMappingURL=mcpSchemaAdapter.js.map