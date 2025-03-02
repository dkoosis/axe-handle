// axe-handle/mcp-schema-parser.ts
/**
 * @file axe-handle/mcp-schema-parser.ts
 * Parses an MCP schema file using the TypeScript compiler API and extracts information
 * about interfaces, types, constants, and MCP-specific components.
 */
import * as fs from 'fs';
import * as ts from 'typescript';
import { getJSDocComment, getMCPTags, typeNodeToString } from './schema-parsing-utilities';

/**
 * Represents the parsed MCP schema.
 */
interface MCPSchema {
  version: string;
  interfaces: Record<string, InterfaceDefinition>;
  types: Record<string, TypeAliasDefinition>;
  constants: Record<string, string | number | boolean>;
  mcp: {
    resources: string[];
    tools: string[];
    prompts: string[];
    capabilities: string[];
  };
  summary: {
    interfaceCount: number;
    typeCount: number;
    constantCount: number;
    resourceCount: number;
    toolCount: number;
    promptCount: number;
  };
}

/**
 * Represents a parsed interface definition.
 */
interface InterfaceDefinition {
  name: string;
  description?: string;
  extends?: string[];
  properties: PropertyDefinition[];
}

/**
 * Represents a property within an interface.
 */
interface PropertyDefinition {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

/**
 * Represents a parsed type alias definition.
 */
interface TypeAliasDefinition {
  name: string;
  type: string;
  description?: string;
}

/**
 * Parses an MCP schema file.
 * @param inputFilePath - The path to the MCP schema file.
 * @returns The parsed MCP schema.
 */
export function parseMCPSchema(inputFilePath: string): MCPSchema {
  console.log(`Reading schema file: ${inputFilePath}`);
  const sourceCode = fs.readFileSync(inputFilePath, 'utf8');
  console.log(`File size: ${sourceCode.length} bytes`);

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    esModuleInterop: true,
    allowJs: true,
    checkJs: false,
    strict: false, // Ideally, this should be true, but we're starting with existing code
    noImplicitAny: false, // Ideally, this should be true
    skipLibCheck: true,
  };

  const sourceFile = ts.createSourceFile(
    inputFilePath,
    sourceCode,
    compilerOptions.target || ts.ScriptTarget.Latest,
    /* setParentNodes */ true
  );

  const schema: MCPSchema = {
    version: 'unknown',
    interfaces: {},
    types: {},
    constants: {},
    mcp: {
      resources: [],
      tools: [],
      prompts: [],
      capabilities: [],
    },
    summary: {
      interfaceCount: 0,
      typeCount: 0,
      constantCount: 0,
      resourceCount: 0,
      toolCount: 0,
      promptCount: 0,
    },
  };

  /**
   * Visits each node in the Abstract Syntax Tree (AST).
   * @param node - The current TypeScript node.
   */
  function visit(node: ts.Node) {
    const modifiers = node.modifiers || [];
    const isExported = modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

    if (ts.isInterfaceDeclaration(node) && isExported) {
      processInterface(node);
    } else if (ts.isTypeAliasDeclaration(node) && isExported) {
      processTypeAlias(node);
    } else if (ts.isVariableStatement(node) && isExported) {
      processVariableStatement(node);
    }

    node.forEachChild(visit);
  }

  /**
   * Processes an interface declaration node.
   * @param node - The interface declaration node.
   */
  function processInterface(node: ts.InterfaceDeclaration) {
    try {
      const interfaceName = node.name.text;
      const description = getJSDocComment(node, sourceFile);
      const mcpTags = getMCPTags(node, sourceFile);

      const extendsClause: string[] = [];
      if (node.heritageClauses) {
        for (const clause of node.heritageClauses) {
          if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
            for (const type of clause.types) {
              extendsClause.push(type.expression.getText());
            }
          }
        }
      }

      const properties: PropertyDefinition[] = [];
      for (const member of node.members) {
        if (ts.isPropertySignature(member)) {
          try {
            const propertyName = member.name.getText();
            const propertyType = member.type ? typeNodeToString(member.type, sourceFile) : 'any';
            const isOptional = !!member.questionToken;
            const propertyDescription = getJSDocComment(member, sourceFile);

            properties.push({
              name: propertyName,
              type: propertyType,
              optional: isOptional,
              description: propertyDescription,
            });
          } catch (error) {
            console.warn(`Warning: Error processing property in interface ${interfaceName}`);
          }
        }
      }

      const interfaceObj: InterfaceDefinition = {
        name: interfaceName,
        description,
        extends: extendsClause.length > 0 ? extendsClause : undefined,
        properties,
      };

      schema.interfaces[interfaceName] = interfaceObj;

      if (mcpTags.resource) {
        schema.mcp.resources.push(interfaceName);
        schema.summary.resourceCount++;
      }
      if (mcpTags.tool) {
        schema.mcp.tools.push(interfaceName);
        schema.summary.toolCount++;
      }
      if (mcpTags.prompt) {
        schema.mcp.prompts.push(interfaceName);
        schema.summary.promptCount++;
      }
      if (mcpTags.capability) {
        schema.mcp.capabilities.push(interfaceName);
      }

      schema.summary.interfaceCount++;
      console.log(`Found interface: ${interfaceName} with ${properties.length} properties`);
    } catch (error: any) {
      console.warn(`Warning: Error processing interface: ${error.message}`);
    }
  }

  /**
   * Processes a type alias declaration node.
   * @param node - The type alias declaration node.
   */
  function processTypeAlias(node: ts.TypeAliasDeclaration) {
    try {
      const typeAliasName = node.name.text;
      const type = typeNodeToString(node.type, sourceFile);
      const description = getJSDocComment(node, sourceFile);
      const mcpTags = getMCPTags(node, sourceFile);

      schema.types[typeAliasName] = {
        name: typeAliasName,
        type,
        description,
      };

      if (mcpTags.resource) {
        schema.mcp.resources.push(typeAliasName);
        schema.summary.resourceCount++;
      }
      if (mcpTags.tool) {
        schema.mcp.tools.push(typeAliasName);
        schema.summary.toolCount++;
      }
      if (mcpTags.prompt) {
        schema.mcp.prompts.push(typeAliasName);
        schema.summary.promptCount++;
      }

      schema.summary.typeCount++;
      console.log(`Found type alias: ${typeAliasName}`);
    } catch (error: any) {
      console.warn(`Warning: Error processing type alias: ${error.message}`);
    }
  }

  /**
   * Processes a variable statement node.
   * @param node - The variable statement node.
   */
  function processVariableStatement(node: ts.VariableStatement) {
    try {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) {
          const constantName = declaration.name.text;
          let value: string | number | boolean;

          if (ts.isStringLiteral(declaration.initializer)) {
            value = declaration.initializer.text;
          } else if (ts.isNumericLiteral(declaration.initializer)) {
            value = Number(declaration.initializer.text);
          } else if (declaration.initializer.kind === ts.SyntaxKind.TrueKeyword) {
            value = true;
          } else if (declaration.initializer.kind === ts.SyntaxKind.FalseKeyword) {
            value = false;
          } else {
            value = declaration.initializer.getText();
          }

          schema.constants[constantName] = value;

          if (constantName === 'LATEST_PROTOCOL_VERSION' && typeof value === 'string') {
            schema.version = value;
            console.log(`Found protocol version: ${schema.version}`);
          }

          schema.summary.constantCount++;
        }
      }
    } catch (error: any) {
      console.warn(`Warning: Error processing constant: ${error.message}`);
    }
  }

    /**
   * Post-processes the schema to identify MCP components based on naming conventions.
   * This supplements the explicit @mcp-* tags.
   * @param schema
   */
    function postProcessSchema(schema: MCPSchema): void {
      // Process interfaces by naming convention if not already categorized
      for (const [name, iface] of Object.entries(schema.interfaces)) {
        // Check for resource patterns
        if (
          !schema.mcp.resources.includes(name) &&
          (name.endsWith('Resource') || name.endsWith('ResourceContents') || name.includes('Resource'))
        ) {
          schema.mcp.resources.push(name);
          schema.summary.resourceCount++;
        }

        // Check for tool patterns
        if (
          !schema.mcp.tools.includes(name) &&
          (name.endsWith('Tool') || name.includes('Tool') || name.endsWith('Request') || name.endsWith('Result'))
        ) {
          schema.mcp.tools.push(name);
          schema.summary.toolCount++;
        }

        // Check for prompt patterns
        if (
          !schema.mcp.prompts.includes(name) &&
          (name.endsWith('Prompt') || name.includes('Prompt') || name.includes('Message'))
        ) {
          schema.mcp.prompts.push(name);
          schema.summary.promptCount++;
        }

        // Check for capability patterns
        if (
          !schema.mcp.capabilities.includes(name) &&
          (name.endsWith('Capabilities') || name.endsWith('Capability'))
        ) {
          schema.mcp.capabilities.push(name);
        }
      }
    }


  visit(sourceFile);
  postProcessSchema(schema);
  return schema;
}