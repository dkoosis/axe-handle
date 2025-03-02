// schema-parser.js
const { getJSDocComment, getMCPTags, typeToString, kebabCase } = require('./utils');
const fs = require('fs');
const ts = require('typescript');

/**
 * Parse an MCP schema using TypeScript compiler API
 */
function parseMCPSchema(inputFile) {
    console.log(`Reading schema file: ${inputFile}`);
    const sourceCode = fs.readFileSync(inputFile, 'utf8');
    console.log(`File size: ${sourceCode.length} bytes`);

    const compilerOptions = {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        esModuleInterop: true,
        allowJs: true,
        checkJs: false,
        strict: false,
        noImplicitAny: false,
        skipLibCheck: true
    };

    const sourceFile = ts.createSourceFile(
        inputFile,
        sourceCode,
        compilerOptions.target || ts.ScriptTarget.Latest,
        /* setParentNodes */ true
    );

    const schema = {
        version: 'unknown',
        interfaces: {},
        types: {},
        constants: {},
        mcp: {
            resources: [],
            tools: [],
            prompts: [],
            capabilities: []
        },
        summary: {
            interfaceCount: 0,
            typeCount: 0,
            constantCount: 0,
            resourceCount: 0,
            toolCount: 0,
            promptCount: 0
        }
    };

    // Extract JSDoc comments (moved to utils)
    function getJSDocComment(node) {
      try {
        const jsDocTags = ts.getJSDocTags(node);
        if (!jsDocTags || jsDocTags.length === 0) {
          // Check for full JSDoc comments
          const nodePos = node.getFullStart();
          const nodeText = sourceFile.getFullText();
          const textBefore = nodeText.substring(0, nodePos);
          
          // Look for JSDoc comment before the node
          const jsDocMatch = textBefore.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/);
          if (jsDocMatch) {
            return jsDocMatch[1]
              .split('\n')
              .map(line => line.replace(/^\s*\*\s?/, ''))
              .join('\n')
              .trim();
          }
          return undefined;
        }
        
        // Process JSDoc tags
        const comments = jsDocTags
          .map(tag => {
            if (tag.comment) {
              return typeof tag.comment === 'string' ? 
                tag.comment : 
                tag.comment.map(part => part.text || '').join('');
            }
            
            if (tag.tagName && tag.tagName.escapedText) {
              return `@${tag.tagName.escapedText}`;
            }
            
            return '';
          })
          .join('\n');
        
        return comments || undefined;
      } catch (error) {
        console.warn(`Warning: Error extracting JSDoc for ${node.getText ? node.getText().slice(0, 20) : 'unknown node'}`);
        return undefined;
      }
    }

    // Extract MCP-specific tags (moved to utils)
    function getMCPTags(node) {
      try {
        const jsDocTags = ts.getJSDocTags(node);
        if (!jsDocTags || jsDocTags.length === 0) return {};
        
        const mcpTags = {};
        
        for (const tag of jsDocTags) {
          if (tag.tagName && tag.tagName.escapedText) {
            const tagName = tag.tagName.escapedText;
            if (tagName === 'mcp-resource') mcpTags.resource = true;
            if (tagName === 'mcp-tool') mcpTags.tool = true;
            if (tagName === 'mcp-prompt') mcpTags.prompt = true;
            if (tagName === 'mcp-capability') mcpTags.capability = true;
          }
        }
        
        return mcpTags;
      } catch (error) {
        console.warn(`Warning: Error extracting MCP tags`);
        return {};
      }
    }

    // Convert type node to string representation (moved to utils)
    function typeToString(typeNode) {
      if (!typeNode) return 'any';
      return typeNode.getText();
    }
    
    function visit(node) {
        const modifiers = node.modifiers || [];
        const isExported = modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);

        if (ts.isInterfaceDeclaration(node) && isExported) {
            processInterface(node, schema, getJSDocComment, getMCPTags, typeToString);
        }
        else if (ts.isTypeAliasDeclaration(node) && isExported) {
            processTypeAlias(node, schema, getJSDocComment, getMCPTags, typeToString);
        }
        else if (ts.isVariableStatement(node) && isExported) {
            processVariableStatement(node, schema);
        }

        node.forEachChild(visit);
    }

    visit(sourceFile);
    postProcessSchema(schema); // Keep post-processing in the parser
    return schema;
}



function processInterface(node, schema, getJSDocComment, getMCPTags, typeToString) {
    try {
        const name = node.name.text;
        const description = getJSDocComment(node);
        const mcpTags = getMCPTags(node);

        const extendsClause = [];
        if (node.heritageClauses) {
            for (const clause of node.heritageClauses) {
                if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                    for (const type of clause.types) {
                        extendsClause.push(type.expression.getText());
                    }
                }
            }
        }

        const properties = [];
        for (const member of node.members) {
            if (ts.isPropertySignature(member)) {
                try {
                    const propName = member.name.getText();
                    const propType = member.type ? typeToString(member.type) : 'any';
                    const optional = !!member.questionToken;
                    const propDescription = getJSDocComment(member);

                    properties.push({
                        name: propName,
                        type: propType,
                        optional,
                        description: propDescription
                    });
                } catch (error) {
                    console.warn(`Warning: Error processing property in interface ${name}`);
                }
            }
        }

        const interfaceObj = {
            name,
            description,
            extends: extendsClause.length > 0 ? extendsClause : undefined,
            properties
        };

        schema.interfaces[name] = interfaceObj;

        if (mcpTags.resource) {
            schema.mcp.resources.push(name);
            schema.summary.resourceCount++;
        }
        if (mcpTags.tool) {
            schema.mcp.tools.push(name);
            schema.summary.toolCount++;
        }
        if (mcpTags.prompt) {
            schema.mcp.prompts.push(name);
            schema.summary.promptCount++;
        }
        if (mcpTags.capability) {
          schema.mcp.capabilities.push(name);
        }

        schema.summary.interfaceCount++;
        console.log(`Found interface: ${name} with ${properties.length} properties`);
    } catch (error) {
        console.warn(`Warning: Error processing interface: ${error.message}`);
    }
}


function processTypeAlias(node, schema, getJSDocComment, getMCPTags, typeToString) {
    try {
        const name = node.name.text;
        const type = typeToString(node.type);
        const description = getJSDocComment(node);
        const mcpTags = getMCPTags(node);

        schema.types[name] = {
            name,
            type,
            description
        };

        if (mcpTags.resource) {
            schema.mcp.resources.push(name);
            schema.summary.resourceCount++;
        }
        if (mcpTags.tool) {
            schema.mcp.tools.push(name);
            schema.summary.toolCount++;
        }
        if (mcpTags.prompt) {
            schema.mcp.prompts.push(name);
            schema.summary.promptCount++;
        }

        schema.summary.typeCount++;
        console.log(`Found type alias: ${name}`);
    } catch (error) {
        console.warn(`Warning: Error processing type alias: ${error.message}`);
    }
}

function processVariableStatement(node, schema) {
    try {
        for (const declaration of node.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.initializer) {
                const name = declaration.name.text;
                let value;

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

                schema.constants[name] = value;

                if (name === 'LATEST_PROTOCOL_VERSION' && typeof value === 'string') {
                    schema.version = value;
                    console.log(`Found protocol version: ${schema.version}`);
                }

                schema.summary.constantCount++;
            }
        }
    } catch (error) {
        console.warn(`Warning: Error processing constant: ${error.message}`);
    }
}


/**
 * Post-process schema to identify MCP components based on naming conventions
 */
function postProcessSchema(schema) {
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

module.exports = { parseMCPSchema };