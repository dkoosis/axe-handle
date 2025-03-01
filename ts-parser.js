// enhanced-ts-parser.js - MCP Schema Parser and Server Code Generator
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const ejs = require('ejs');

/**
 * Parse an MCP schema using TypeScript compiler API
 */
function parseMCPSchema(inputFile) {
  console.log(`Reading schema file: ${inputFile}`);
  const sourceCode = fs.readFileSync(inputFile, 'utf8');
  console.log(`File size: ${sourceCode.length} bytes`);
  
  // Configure TypeScript compiler options (minimal setup)
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
  
  // Parse the source code directly without requiring a tsconfig.json
  const sourceFile = ts.createSourceFile(
    inputFile,
    sourceCode,
    compilerOptions.target || ts.ScriptTarget.Latest,
    /* setParentNodes */ true
  );
  
  // Initialize schema object
  const schema = {
    version: 'unknown',
    interfaces: {},
    types: {},
    constants: {},
    // Add MCP-specific categorization
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
  
  // Extract JSDoc comments
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
  
  // Extract MCP-specific tags
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
  
  // Convert type node to string representation
  function typeToString(typeNode) {
    if (!typeNode) return 'any';
    return typeNode.getText();
  }
  
  // Visitor function to process nodes
  function visit(node) {
    // Check if node is exported
    const modifiers = node.modifiers || [];
    const isExported = modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    
    // Process interfaces
    if (ts.isInterfaceDeclaration(node) && isExported) {
      try {
        const name = node.name.text;
        const description = getJSDocComment(node);
        const mcpTags = getMCPTags(node);
        
        // Get extends clause
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
        
        // Parse properties
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
        
        // Create interface object
        const interfaceObj = {
          name,
          description,
          extends: extendsClause.length > 0 ? extendsClause : undefined,
          properties
        };
        
        schema.interfaces[name] = interfaceObj;
        
        // Add to MCP-specific categorization if tagged
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
    
    // Process type aliases
    else if (ts.isTypeAliasDeclaration(node) && isExported) {
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
        
        // Add to MCP-specific categorization if tagged
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
    
    // Process constants
    else if (ts.isVariableStatement(node) && isExported) {
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
    
    // Visit children
    node.forEachChild(visit);
  }
  
  // Start traversal
  visit(sourceFile);
  
  // Post-process schema to identify MCP components based on naming conventions if not tagged
  postProcessSchema(schema);
  
  return schema;
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

/**
 * Generate markdown documentation from a parsed MCP schema
 */
function generateMarkdown(schema) {
  let md = `# MCP Schema Documentation\n\n`;
  md += `Protocol Version: ${schema.version}\n\n`;
  md += `## Summary\n\n`;
  md += `- Interfaces: ${schema.summary.interfaceCount}\n`;
  md += `- Type Aliases: ${schema.summary.typeCount}\n`;
  md += `- Constants: ${schema.summary.constantCount}\n`;
  md += `- MCP Resources: ${schema.summary.resourceCount}\n`;
  md += `- MCP Tools: ${schema.summary.toolCount}\n`;
  md += `- MCP Prompts: ${schema.summary.promptCount}\n\n`;
  
  // Document constants
  md += `## Constants\n\n`;
  md += `| Name | Value |\n`;
  md += `|------|-------|\n`;
  
  Object.entries(schema.constants)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([name, value]) => {
      md += `| \`${name}\` | \`${value}\` |\n`;
    });
  
  md += `\n`;
  
  // Document MCP Resources
  if (schema.mcp.resources.length > 0) {
    md += `## MCP Resources\n\n`;
    
    schema.mcp.resources.forEach(name => {
      const resource = schema.interfaces[name] || schema.types[name];
      if (!resource) return;
      
      md += `### ${name}\n\n`;
      if (resource.description) {
        md += `${resource.description}\n\n`;
      }
      
      if (resource.extends) {
        md += `*Extends: ${resource.extends.join(', ')}*\n\n`;
      }
      
      if (resource.properties) {
        md += `| Property | Type | Optional | Description |\n`;
        md += `|----------|------|----------|-------------|\n`;
        
        resource.properties.forEach(prop => {
          const description = prop.description ? prop.description.split('\n')[0] : '';
          md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'Yes' : 'No'} | ${description} |\n`;
        });
        
        md += `\n`;
      }
    });
  }
  
  // Document MCP Tools
  if (schema.mcp.tools.length > 0) {
    md += `## MCP Tools\n\n`;
    
    schema.mcp.tools.forEach(name => {
      const tool = schema.interfaces[name] || schema.types[name];
      if (!tool) return;
      
      md += `### ${name}\n\n`;
      if (tool.description) {
        md += `${tool.description}\n\n`;
      }
      
      if (tool.extends) {
        md += `*Extends: ${tool.extends.join(', ')}*\n\n`;
      }
      
      if (tool.properties) {
        md += `| Property | Type | Optional | Description |\n`;
        md += `|----------|------|----------|-------------|\n`;
        
        tool.properties.forEach(prop => {
          const description = prop.description ? prop.description.split('\n')[0] : '';
          md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'Yes' : 'No'} | ${description} |\n`;
        });
        
        md += `\n`;
      }
    });
  }
  
  // Document MCP Prompts
  if (schema.mcp.prompts.length > 0) {
    md += `## MCP Prompts\n\n`;
    
    schema.mcp.prompts.forEach(name => {
      const prompt = schema.interfaces[name] || schema.types[name];
      if (!prompt) return;
      
      md += `### ${name}\n\n`;
      if (prompt.description) {
        md += `${prompt.description}\n\n`;
      }
      
      if (prompt.extends) {
        md += `*Extends: ${prompt.extends.join(', ')}*\n\n`;
      }
      
      if (prompt.properties) {
        md += `| Property | Type | Optional | Description |\n`;
        md += `|----------|------|----------|-------------|\n`;
        
        prompt.properties.forEach(prop => {
          const description = prop.description ? prop.description.split('\n')[0] : '';
          md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'Yes' : 'No'} | ${description} |\n`;
        });
        
        md += `\n`;
      }
    });
  }
  
  // Document remaining type aliases
  md += `## Type Aliases\n\n`;
  
  Object.values(schema.types)
    .filter(type => {
      const name = type.name;
      return !schema.mcp.resources.includes(name) && 
             !schema.mcp.tools.includes(name) && 
             !schema.mcp.prompts.includes(name);
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(type => {
      md += `### ${type.name}\n\n`;
      
      if (type.description) {
        md += `${type.description}\n\n`;
      }
      
      md += `\`\`\`typescript\ntype ${type.name} = ${type.type};\n\`\`\`\n\n`;
    });
  
  // Document remaining interfaces
  md += `## Interfaces\n\n`;
  
  Object.values(schema.interfaces)
    .filter(iface => {
      const name = iface.name;
      return !schema.mcp.resources.includes(name) && 
             !schema.mcp.tools.includes(name) && 
             !schema.mcp.prompts.includes(name);
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(iface => {
      md += `### ${iface.name}\n\n`;
      
      if (iface.description) {
        md += `${iface.description}\n\n`;
      }
      
      if (iface.extends) {
        md += `*Extends: ${iface.extends.join(', ')}*\n\n`;
      }
      
      if (iface.properties && iface.properties.length > 0) {
        md += `| Property | Type | Optional | Description |\n`;
        md += `|----------|------|----------|-------------|\n`;
        
        iface.properties.forEach(prop => {
          const description = prop.description ? prop.description.split('\n')[0] : '';
          md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'Yes' : 'No'} | ${description} |\n`;
        });
        
        md += `\n`;
      } else {
        md += `*No properties*\n\n`;
      }
    });
  
  return md;
}

/**
 * Generate server code from a parsed MCP schema
 */
function generateServerCode(schema, options = {}) {
  const framework = options.framework || 'express';
  const outputDir = options.outputDir || './generated';
  const serverName = options.serverName || 'mcp-server';
  
  console.log(`Generating ${framework} server code for MCP schema...`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create src directory
  const srcDir = path.join(outputDir, 'src');
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }
  
  // Create models directory
  const modelsDir = path.join(srcDir, 'models');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
  
  // Create handlers directory
  const handlersDir = path.join(srcDir, 'handlers');
  if (!fs.existsSync(handlersDir)) {
    fs.mkdirSync(handlersDir, { recursive: true });
  }
  
  // Load templates based on selected framework
  const templatesDir = path.join(__dirname, 'templates', framework);
  
  try {
    // Generate package.json
    const packageJsonTemplate = fs.readFileSync(path.join(templatesDir, 'package.json.ejs'), 'utf8');
    const packageJson = ejs.render(packageJsonTemplate, {
      serverName,
      schema
    });
    fs.writeFileSync(path.join(outputDir, 'package.json'), packageJson);
    console.log(`Generated package.json`);
    
    // Generate tsconfig.json
    const tsconfigTemplate = fs.readFileSync(path.join(templatesDir, 'tsconfig.json.ejs'), 'utf8');
    const tsconfig = ejs.render(tsconfigTemplate, {
      schema
    });
    fs.writeFileSync(path.join(outputDir, 'tsconfig.json'), tsconfig);
    console.log(`Generated tsconfig.json`);
    
    // Generate main server file
    const serverTemplate = fs.readFileSync(path.join(templatesDir, 'server.ts.ejs'), 'utf8');
    const server = ejs.render(serverTemplate, {
      schema,
      serverName
    });
    fs.writeFileSync(path.join(srcDir, 'server.ts'), server);
    console.log(`Generated server.ts`);
    
    // Generate types file
    const typesTemplate = fs.readFileSync(path.join(templatesDir, 'types.ts.ejs'), 'utf8');
    const types = ejs.render(typesTemplate, {
      schema
    });
    fs.writeFileSync(path.join(modelsDir, 'types.ts'), types);
    console.log(`Generated types.ts`);
    
    // Generate resource models
    if (schema.mcp.resources.length > 0) {
      const resourceModelTemplate = fs.readFileSync(path.join(templatesDir, 'resource-model.ts.ejs'), 'utf8');
      
      schema.mcp.resources.forEach(resourceName => {
        const resource = schema.interfaces[resourceName] || schema.types[resourceName];
        if (!resource) return;
        
        const resourceModel = ejs.render(resourceModelTemplate, {
          resource,
          schema
        });
        
        const fileName = `${kebabCase(resourceName)}.ts`;
        fs.writeFileSync(path.join(modelsDir, fileName), resourceModel);
        console.log(`Generated resource model: ${fileName}`);
      });
    }
    
    // Generate tool handlers
    if (schema.mcp.tools.length > 0) {
      const toolHandlerTemplate = fs.readFileSync(path.join(templatesDir, 'tool-handler.ts.ejs'), 'utf8');
      
      schema.mcp.tools.forEach(toolName => {
        const tool = schema.interfaces[toolName] || schema.types[toolName];
        if (!tool) return;
        
        // Skip if it's a Request/Response interface
        if (toolName.endsWith('Request') || toolName.endsWith('Response') || toolName.endsWith('Result')) {
          return;
        }
        
        const toolHandler = ejs.render(toolHandlerTemplate, {
          tool,
          schema
        });
        
        const fileName = `${kebabCase(toolName)}-handler.ts`;
        fs.writeFileSync(path.join(handlersDir, fileName), toolHandler);
        console.log(`Generated tool handler: ${fileName}`);
      });
    }
    
    // Generate prompt handlers
    if (schema.mcp.prompts.length > 0) {
      const promptHandlerTemplate = fs.readFileSync(path.join(templatesDir, 'prompt-handler.ts.ejs'), 'utf8');
      
      schema.mcp.prompts.forEach(promptName => {
        const prompt = schema.interfaces[promptName] || schema.types[promptName];
        if (!prompt) return;
        
        // Skip if it's a Request/Response interface
        if (promptName.endsWith('Request') || promptName.endsWith('Response') || promptName.endsWith('Result')) {
          return;
        }
        
        const promptHandler = ejs.render(promptHandlerTemplate, {
          prompt,
          schema
        });
        
        const fileName = `${kebabCase(promptName)}-handler.ts`;
        fs.writeFileSync(path.join(handlersDir, fileName), promptHandler);
        console.log(`Generated prompt handler: ${fileName}`);
      });
    }
    
    // Generate README.md for the server
    const readmeTemplate = fs.readFileSync(path.join(templatesDir, 'README.md.ejs'), 'utf8');
    const readme = ejs.render(readmeTemplate, {
      schema,
      serverName
    });
    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
    console.log(`Generated README.md`);
    
    console.log(`Server code generation complete!`);
    console.log(`\nNext steps:`);
    console.log(`1. cd ${outputDir}`);
    console.log(`2. npm install`);
    console.log(`3. npm run dev`);
    
    return true;
  } catch (error) {
    console.error(`Error generating server code:`, error);
    return false;
  }
}

/**
 * Utility function to convert camelCase to kebab-case
 */
function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Initialize a new MCP schema file
 */
function initSchema(outputFile, options = {}) {
  const name = options.name || 'MyMCPServer';
  const description = options.description || 'My MCP Server';
  
  // Basic MCP schema template
  const schemaTemplate = `/**
 * ${description}
 * MCP Schema definition file
 */

export const LATEST_PROTOCOL_VERSION = "DRAFT-2025-v1";
export const JSONRPC_VERSION = "2.0";

/**
 * @mcp-resource
 * A sample resource provided by this MCP server
 */
export interface SampleResource {
  /**
   * The unique identifier for this resource
   */
  id: string;
  
  /**
   * The name of the resource
   */
  name: string;
  
  /**
   * Optional description of the resource
   */
  description?: string;
  
  /**
   * Creation timestamp
   */
  createdAt: string;
}

/**
 * @mcp-tool
 * A tool to work with sample resources
 */
export interface SampleTool {
  /**
   * The name of the tool
   */
  name: string;
  
  /**
   * Description of what the tool does
   */
  description: string;
}

/**
 * Request to get a sample resource
 */
export interface GetSampleResourceRequest {
  /**
   * The ID of the resource to retrieve
   */
  id: string;
}

/**
 * Response containing the requested sample resource
 */
export interface GetSampleResourceResponse {
  /**
   * The requested resource
   */
  resource: SampleResource;
}

/**
 * @mcp-prompt
 * A sample prompt template
 */
export interface SamplePrompt {
  /**
   * The name of the prompt template
   */
  name: string;
  
  /**
   * Description of the prompt
   */
  description: string;
  
  /**
   * Template variables
   */
  variables: string[];
  
  /**
   * The actual prompt template
   */
  template: string;
}

/**
 * Server capabilities
 */
export interface ${name}Capabilities {
  /**
   * Whether the server supports resources
   */
  resources: boolean;
  
  /**
   * Whether the server supports tools
   */
  tools: boolean;
  
  /**
   * Whether the server supports prompts
   */
  prompts: boolean;
}
`;

  // Write the schema template to the output file
  fs.writeFileSync(outputFile, schemaTemplate);
  console.log(`Initialized new MCP schema at ${outputFile}`);
  
  return true;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === '--help' || command === '-h') {
    console.log(`
MCP Schema Parser and Server Generator

Usage:
  node enhanced-ts-parser.js <command> [options]

Commands:
  parse <input-file>            Parse an MCP schema file and output information
  docs <input-file> <output>    Generate documentation from an MCP schema file
  generate <input-file>         Generate server code from an MCP schema file
  init <output-file>            Initialize a new MCP schema file

Options for 'parse':
  --json, -j <file>             Output parsed schema as JSON to the specified file

Options for 'generate':
  --framework, -f <name>        Server framework to use (express, nest, fastify) [default: express]
  --output, -o <dir>            Output directory for generated code [default: ./generated]
  --name, -n <name>             Name for the generated server [default: mcp-server]

Options for 'init':
  --name, -n <name>             Name for the MCP server [default: MyMCPServer]
  --description, -d <text>      Description of the MCP server

Examples:
  node enhanced-ts-parser.js parse schema.ts --json schema.json
  node enhanced-ts-parser.js docs schema.ts docs.md
  node enhanced-ts-parser.js generate schema.ts --framework express --output ./my-server
  node enhanced-ts-parser.js init my-schema.ts --name "WeatherMCP" --description "Weather MCP Server"
  `);
    return;
  }
  
  try {
    if (command === 'parse') {
      const inputFile = args[1];
      if (!inputFile) {
        console.error('Error: Input file is required for parse command');
        return;
      }
      
      let outputJson = null;
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--json' || args[i] === '-j') {
          outputJson = args[++i];
        }
      }
      
      const schema = parseMCPSchema(inputFile);
      
      // Print summary
      console.log('\nSchema Summary:');
      console.log(`- Protocol Version: ${schema.version}`);
      console.log(`- Interfaces: ${schema.summary.interfaceCount}`);
      console.log(`- Type Aliases: ${schema.summary.typeCount}`);
      console.log(`- Constants: ${schema.summary.constantCount}`);
      console.log(`- MCP Resources: ${schema.summary.resourceCount}`);
      console.log(`- MCP Tools: ${schema.summary.toolCount}`);
      console.log(`- MCP Prompts: ${schema.summary.promptCount}`);
      
      // Output JSON if requested
      if (outputJson) {
        fs.writeFileSync(outputJson, JSON.stringify(schema, null, 2));
        console.log(`\nJSON schema written to ${outputJson}`);
      }
      
    } else if (command === 'docs') {
      const inputFile = args[1];
      const outputFile = args[2];
      
      if (!inputFile || !outputFile) {
        console.error('Error: Input and output files are required for docs command');
        return;
      }
      
      const schema = parseMCPSchema(inputFile);
      const markdown = generateMarkdown(schema);
      
      fs.writeFileSync(outputFile, markdown);
      console.log(`\nDocumentation written to ${outputFile}`);
      
    } else if (command === 'generate') {
      const inputFile = args[1];
      
      if (!inputFile) {
        console.error('Error: Input file is required for generate command');
        return;
      }
      
      // Parse options
      let framework = 'express';
      let outputDir = './generated';
      let serverName = 'mcp-server';
      
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--framework' || args[i] === '-f') {
          framework = args[++i];
        } else if (args[i] === '--output' || args[i] === '-o') {
          outputDir = args[++i];
        } else if (args[i] === '--name' || args[i] === '-n') {
          serverName = args[++i];
        }
      }
      
      // Validate framework
      const supportedFrameworks = ['express', 'nest', 'fastify'];
      if (!supportedFrameworks.includes(framework)) {
        console.error(`Error: Unsupported framework '${framework}'. Supported frameworks: ${supportedFrameworks.join(', ')}`);
        return;
      }
      
      const schema = parseMCPSchema(inputFile);
      const success = generateServerCode(schema, { framework, outputDir, serverName });
      
      if (!success) {
        console.error(`\nServer code generation failed.`);
        return;
      }
      
    } else if (command === 'init') {
      const outputFile = args[1];
      
      if (!outputFile) {
        console.error('Error: Output file is required for init command');
        return;
      }
      
      // Parse options
      let name = 'MyMCPServer';
      let description = 'My MCP Server';
      
      for (let i = 2; i < args.length; i++) {
        if (args[i] === '--name' || args[i] === '-n') {
          name = args[++i];
        } else if (args[i] === '--description' || args[i] === '-d') {
          description = args[++i];
        }
      }
      
      initSchema(outputFile, { name, description });
    } else {
      console.error(`Error: Unknown command '${command}'`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Set up templates for code generation
function setupTemplates() {
  // Create templates directory if it doesn't exist
  const templatesDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  // Set up Express templates
  const expressDir = path.join(templatesDir, 'express');
  if (!fs.existsSync(expressDir)) {
    fs.mkdirSync(expressDir, { recursive: true });
  }
  
  // Create example templates for Express
  createExpressTemplates(expressDir);
  
  // Set up NestJS templates
  const nestDir = path.join(templatesDir, 'nest');
  if (!fs.existsSync(nestDir)) {
    fs.mkdirSync(nestDir, { recursive: true });
  }
  
  // Create example templates for NestJS
  createNestTemplates(nestDir);
  
  // Set up Fastify templates
  const fastifyDir = path.join(templatesDir, 'fastify');
  if (!fs.existsSync(fastifyDir)) {
    fs.mkdirSync(fastifyDir, { recursive: true });
  }
  
  // Create example templates for Fastify
  createFastifyTemplates(fastifyDir);
  
  console.log(`Templates set up successfully`);
}

// Create Express templates
function createExpressTemplates(expressDir) {
  // package.json template
  const packageJson = `{
  "name": "<%= serverName %>",
  "version": "1.0.0",
  "description": "MCP Server generated by Axe Handle",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/server.ts",
    "start": "node dist/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/node": "^18.15.3",
    "ts-node": "^10.9.1",
    "typescript": "^5.0.2",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5"
  }
}`;
  fs.writeFileSync(path.join(expressDir, 'package.json.ejs'), packageJson);
  
  // tsconfig.json template
  const tsconfig = `{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}`;
  fs.writeFileSync(path.join(expressDir, 'tsconfig.json.ejs'), tsconfig);
  
  // server.ts template
  const server = `import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import winston from 'winston';

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

// MCP initialization endpoint
app.post('/initialize', (req, res) => {
  const { protocolVersion, capabilities, clientInfo } = req.body.params;
  
  // Validate protocol version
  if (protocolVersion !== '<%= schema.version %>') {
    logger.warn(\`Client requested unsupported protocol version: \${protocolVersion}\`);
  }
  
  // Return server capabilities
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      protocolVersion: '<%= schema.version %>',
      serverInfo: {
        name: '<%= serverName %>',
        version: '1.0.0'
      },
      capabilities: {
        <% if (schema.mcp.resources.length > 0) { %>resources: {},<% } %>
        <% if (schema.mcp.tools.length > 0) { %>tools: {},<% } %>
        <% if (schema.mcp.prompts.length > 0) { %>prompts: {},<% } %>
      },
      instructions: 'This MCP server provides access to <%= schema.mcp.resources.length %> resources, <%= schema.mcp.tools.length %> tools, and <%= schema.mcp.prompts.length %> prompts.'
    }
  });
});

<% if (schema.mcp.resources.length > 0) { %>
// Import resource handlers
<% schema.mcp.resources.forEach(function(resourceName) { %>
// import { get<%= resourceName %> } from './handlers/<%= kebabCase(resourceName) %>-handler';
<% }); %>

// Resource endpoints
app.post('/resources/list', (req, res) => {
  // Implementation for listing resources
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      resources: [
        <% schema.mcp.resources.forEach(function(resourceName, index) { %>
        {
          uri: 'mcp://<%= resourceName.toLowerCase() %>',
          name: '<%= resourceName %>',
          description: '<%= schema.interfaces[resourceName]?.description || "" %>'
        }<%= index < schema.mcp.resources.length - 1 ? ',' : '' %>
        <% }); %>
      ]
    }
  });
});

app.post('/resources/read', (req, res) => {
  const { uri } = req.body.params;
  // Implementation for reading resources based on URI
  // (This is a placeholder - implement actual logic)
  
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ message: 'Resource data would go here' })
        }
      ]
    }
  });
});
<% } %>

<% if (schema.mcp.tools.length > 0) { %>
// Import tool handlers
<% schema.mcp.tools.forEach(function(toolName) { 
  if (!toolName.endsWith('Request') && !toolName.endsWith('Response') && !toolName.endsWith('Result')) { %>
// import { handle<%= toolName %> } from './handlers/<%= kebabCase(toolName) %>-handler';
<% }
}); %>

// Tool endpoints
app.post('/tools/list', (req, res) => {
  // Implementation for listing tools
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      tools: [
        <% schema.mcp.tools.forEach(function(toolName, index) { 
          if (!toolName.endsWith('Request') && !toolName.endsWith('Response') && !toolName.endsWith('Result')) { %>
        {
          name: '<%= toolName %>',
          description: '<%= schema.interfaces[toolName]?.description || "" %>',
          inputSchema: {
            type: 'object',
            properties: {
              <% const tool = schema.interfaces[toolName];
              if (tool && tool.properties) {
                tool.properties.forEach(function(prop, propIndex) { %>
              <%= prop.name %>: {
                type: '<%= prop.type.toLowerCase().includes('string') ? 'string' : (prop.type.toLowerCase().includes('number') ? 'number' : 'object') %>'
              }<%= propIndex < tool.properties.length - 1 ? ',' : '' %>
              <% }); 
              } %>
            }
          }
        }<%= index < schema.mcp.tools.length - 1 ? ',' : '' %>
        <% }
        }); %>
      ]
    }
  });
});

app.post('/tools/call', (req, res) => {
  const { name, arguments: args } = req.body.params;
  
  // Implementation for calling tools based on name
  // (This is a placeholder - implement actual logic per tool)
  
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      content: [
        {
          type: 'text',
          text: \`Tool \${name} called with arguments: \${JSON.stringify(args)}\`
        }
      ],
      isError: false
    }
  });
});
<% } %>

<% if (schema.mcp.prompts.length > 0) { %>
// Import prompt handlers
<% schema.mcp.prompts.forEach(function(promptName) { 
  if (!promptName.endsWith('Request') && !promptName.endsWith('Response') && !promptName.endsWith('Result')) { %>
// import { get<%= promptName %> } from './handlers/<%= kebabCase(promptName) %>-handler';
<% }
}); %>

// Prompt endpoints
app.post('/prompts/list', (req, res) => {
  // Implementation for listing prompts
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      prompts: [
        <% schema.mcp.prompts.forEach(function(promptName, index) { 
          if (!promptName.endsWith('Request') && !promptName.endsWith('Response') && !promptName.endsWith('Result')) { %>
        {
          name: '<%= promptName %>',
          description: '<%= schema.interfaces[promptName]?.description || "" %>',
          arguments: [
            <% const prompt = schema.interfaces[promptName];
            if (prompt && prompt.properties) {
              prompt.properties.forEach(function(prop, propIndex) { %>
            {
              name: '<%= prop.name %>',
              description: '<%= prop.description || "" %>',
              required: <%= !prop.optional %>
            }<%= propIndex < prompt.properties.length - 1 ? ',' : '' %>
            <% }); 
            } %>
          ]
        }<%= index < schema.mcp.prompts.length - 1 ? ',' : '' %>
        <% }
        }); %>
      ]
    }
  });
});

app.post('/prompts/get', (req, res) => {
  const { name, arguments: args } = req.body.params;
  
  // Implementation for getting prompts based on name
  // (This is a placeholder - implement actual logic per prompt)
  
  res.json({
    jsonrpc: "2.0",
    id: req.body.id,
    result: {
      description: \`Prompt for \${name}\`,
      messages: [
        {
          role: "assistant",
          content: {
            type: "text",
            text: \`This is a sample prompt for \${name} with arguments: \${JSON.stringify(args)}\`
          }
        }
      ]
    }
  });
});
<% } %>

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack
  });
  
  res.status(500).json({
    jsonrpc: "2.0",
    id: req.body?.id || null,
    error: {
      code: -32603,
      message: "Internal server error"
    }
  });
});

// Start the server
app.listen(port, () => {
  logger.info(\`MCP Server running at http://localhost:\${port}\`);
});

// Helper function for kebab-case conversion
function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
`;
  fs.writeFileSync(path.join(expressDir, 'server.ts.ejs'), server);
  
  // types.ts template
  const types = `// Generated MCP Types

// Constants
<% Object.entries(schema.constants).forEach(function([name, value]) { %>
export const <%= name %> = <%= typeof value === 'string' ? `"${value}"` : value %>;
<% }); %>

// Type Aliases
<% Object.entries(schema.types).forEach(function([name, type]) { %>
export type <%= name %> = <%= type.type %>;
<% }); %>

// Interfaces
<% Object.entries(schema.interfaces).forEach(function([name, iface]) { %>
export interface <%= name %><% if (iface.extends && iface.extends.length > 0) { %> extends <%= iface.extends.join(', ') %><% } %> {
  <% if (iface.properties && iface.properties.length > 0) { 
    iface.properties.forEach(function(prop) { %>
  <%= prop.name %><%= prop.optional ? '?' : '' %>: <%= prop.type %>;
    <% }); 
  } %>
}
<% }); %>
`;
  fs.writeFileSync(path.join(expressDir, 'types.ts.ejs'), types);
  
  // resource-model.ts template
  const resourceModel = `import { <%= resource.name %> } from '../models/types';

/**
 * Data access for <%= resource.name %>
 */
export class <%= resource.name %>Model {
  // In-memory storage for demonstration
  private static items: <%= resource.name %>[] = [];
  
  /**
   * Get all <%= resource.name %> items
   */
  static getAll(): <%= resource.name %>[] {
    return this.items;
  }
  
  /**
   * Get a <%= resource.name %> by ID
   */
  static getById(id: string): <%= resource.name %> | undefined {
    return this.items.find(item => item.id === id);
  }
  
  /**
   * Create a new <%= resource.name %>
   */
  static create(item: <%= resource.name %>): <%= resource.name %> {
    this.items.push(item);
    return item;
  }
  
  /**
   * Update a <%= resource.name %>
   */
  static update(id: string, updatedItem: Partial<<%= resource.name %>>): <%= resource.name %> | undefined {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    
    this.items[index] = { ...this.items[index], ...updatedItem };
    return this.items[index];
  }
  
  /**
   * Delete a <%= resource.name %>
   */
  static delete(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.items.splice(index, 1);
    return true;
  }
}
`;
  fs.writeFileSync(path.join(expressDir, 'resource-model.ts.ejs'), resourceModel);
  
  // tool-handler.ts template
  const toolHandler = `import { <%= tool.name %> } from '../models/types';

/**
 * Handler for <%= tool.name %> tool
 */
export class <%= tool.name %>Handler {
  /**
   * Handle the <%= tool.name %> tool call
   */
  static handle(args: any): {
    content: Array<{ type: string, text: string }>;
    isError: boolean;
  } {
    try {
      // Implement tool-specific logic here
      const result = \`Executed <%= tool.name %> with arguments: \${JSON.stringify(args)}\`;
      
      return {
        content: [
          {
            type: 'text',
            text: result
          }
        ],
        isError: false
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: \`Error executing <%= tool.name %>: \${error.message}\`
          }
        ],
        isError: true
      };
    }
  }
}
`;
  fs.writeFileSync(path.join(expressDir, 'tool-handler.ts.ejs'), toolHandler);
  
  // prompt-handler.ts template
  const promptHandler = `import { <%= prompt.name %> } from '../models/types';

/**
 * Handler for <%= prompt.name %> prompt
 */
export class <%= prompt.name %>Handler {
  /**
   * Get the <%= prompt.name %> prompt with filled arguments
   */
  static get(args: any): {
    description: string;
    messages: Array<{
      role: string;
      content: { type: string, text: string };
    }>;
  } {
    // Implement prompt-specific logic here
    // This is a placeholder implementation
    return {
      description: '<%= prompt.description || "Generated prompt" %>',
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: \`This is a sample prompt for <%= prompt.name %> with arguments: \${JSON.stringify(args)}\`
          }
        }
      ]
    };
  }
}
`;
  fs.writeFileSync(path.join(expressDir, 'prompt-handler.ts.ejs'), promptHandler);
  
  // README.md template
  const readme = `# <%= serverName %>

This MCP server was generated using [Axe Handle](https://github.com/yourusername/axe-handle).

## MCP Protocol Version

This server implements MCP Protocol version: <%= schema.version %>

## Features

<% if (schema.mcp.resources.length > 0) { %>
### Resources

The following resources are available:

<% schema.mcp.resources.forEach(function(resourceName) { %>
- <%= resourceName %>: <%= schema.interfaces[resourceName]?.description || "No description" %>
<% }); %>
<% } %>

<% if (schema.mcp.tools.length > 0) { %>
### Tools

The following tools are available:

<% schema.mcp.tools.forEach(function(toolName) { 
  if (!toolName.endsWith('Request') && !toolName.endsWith('Response') && !toolName.endsWith('Result')) { %>
- <%= toolName %>: <%= schema.interfaces[toolName]?.description || "No description" %>
<% }
}); %>
<% } %>

<% if (schema.mcp.prompts.length > 0) { %>
### Prompts

The following prompts are available:

<% schema.mcp.prompts.forEach(function(promptName) { 
  if (!promptName.endsWith('Request') && !promptName.endsWith('Response') && !promptName.endsWith('Result')) { %>
- <%= promptName %>: <%= schema.interfaces[promptName]?.description || "No description" %>
<% }
}); %>
<% } %>

## Getting Started

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`
   npm run build
   \`\`\`

4. Start the production server:
   \`\`\`
   npm start
   \`\`\`

## Documentation

For more information about the MCP protocol, see the [Model Context Protocol specification](https://github.com/mcp).

## Extending This Server

To add custom logic:

1. Implement your resource models in \`src/models/\`
2. Implement your tool handlers in \`src/handlers/\`
3. Implement your prompt handlers in \`src/handlers/\`
`;
  fs.writeFileSync(path.join(expressDir, 'README.md.ejs'), readme);
}

// Create NestJS templates
function createNestTemplates(nestDir) {
  // Add placeholder
  fs.writeFileSync(path.join(nestDir, 'package.json.ejs'), '{ "name": "nest-placeholder" }');
  fs.writeFileSync(path.join(nestDir, 'tsconfig.json.ejs'), '{ "compilerOptions": {} }');
  fs.writeFileSync(path.join(nestDir, 'server.ts.ejs'), '// NestJS server template to be implemented');
  fs.writeFileSync(path.join(nestDir, 'types.ts.ejs'), '// NestJS types template to be implemented');
  fs.writeFileSync(path.join(nestDir, 'resource-model.ts.ejs'), '// NestJS resource model template to be implemented');
  fs.writeFileSync(path.join(nestDir, 'tool-handler.ts.ejs'), '// NestJS tool handler template to be implemented');
  fs.writeFileSync(path.join(nestDir, 'prompt-handler.ts.ejs'), '// NestJS prompt handler template to be implemented');
  fs.writeFileSync(path.join(nestDir, 'README.md.ejs'), '# NestJS MCP Server (Template to be implemented)');
}

// Create Fastify templates
function createFastifyTemplates(fastifyDir) {
  // Add placeholder
  fs.writeFileSync(path.join(fastifyDir, 'package.json.ejs'), '{ "name": "fastify-placeholder" }');
  fs.writeFileSync(path.join(fastifyDir, 'tsconfig.json.ejs'), '{ "compilerOptions": {} }');
  fs.writeFileSync(path.join(fastifyDir, 'server.ts.ejs'), '// Fastify server template to be implemented');
  fs.writeFileSync(path.join(fastifyDir, 'types.ts.ejs'), '// Fastify types template to be implemented');
  fs.writeFileSync(path.join(fastifyDir, 'resource-model.ts.ejs'), '// Fastify resource model template to be implemented');
  fs.writeFileSync(path.join(fastifyDir, 'tool-handler.ts.ejs'), '// Fastify tool handler template to be implemented');
  fs.writeFileSync(path.join(fastifyDir, 'prompt-handler.ts.ejs'), '// Fastify prompt handler template to be implemented');
  fs.writeFileSync(path.join(fastifyDir, 'README.md.ejs'), '# Fastify MCP Server (Template to be implemented)');
}

// Setup templates on first run
if (require.main === module) {
  if (process.argv.includes('--setup-templates')) {
    setupTemplates();
  } else {
    main();
  }
}

// Export for use in other modules
module.exports = {
  parseMCPSchema,
  generateMarkdown,
  generateServerCode,
  initSchema,
  setupTemplates
};
