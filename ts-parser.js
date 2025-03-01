// ts-parser.js - Uses TypeScript compiler API but with minimal dependencies
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

/**
 * Parse an MCP schema using TypeScript compiler API with minimal configuration
 */
function parseMCPSchema(inputFile) {
  console.log(`Reading file: ${inputFile}`);
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
    summary: {
      interfaceCount: 0,
      typeCount: 0,
      constantCount: 0
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
        
        schema.interfaces[name] = {
          name,
          description,
          extends: extendsClause.length > 0 ? extendsClause : undefined,
          properties
        };
        
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
        
        schema.types[name] = {
          name,
          type,
          description
        };
        
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
  
  return schema;
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
  md += `- Constants: ${schema.summary.constantCount}\n\n`;
  
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
  
  // Document type aliases
  md += `## Type Aliases\n\n`;
  
  Object.values(schema.types)
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(type => {
      md += `### ${type.name}\n\n`;
      
      if (type.description) {
        md += `${type.description}\n\n`;
      }
      
      md += `\`\`\`typescript\ntype ${type.name} = ${type.type};\n\`\`\`\n\n`;
    });
  
  // Document interfaces
  md += `## Interfaces\n\n`;
  
  Object.values(schema.interfaces)
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

// Main function
function main() {
  const args = process.argv.slice(2);
  let inputFile = null;
  let outputJson = null;
  let outputDocs = null;
  let showHelp = false;
  
  // Parse command-line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      showHelp = true;
    } else if (arg === '--json' || arg === '-j') {
      outputJson = args[++i];
    } else if (arg === '--docs' || arg === '-d') {
      outputDocs = args[++i];
    } else if (!inputFile) {
      inputFile = arg;
    }
  }
  
  // Show help
  if (showHelp || !inputFile) {
    console.log(`
MCP Schema Parser (TypeScript AST Version)

Usage:
  node ts-parser.js [options] <input-file>

Options:
  --help, -h           Show this help message
  --json, -j <file>    Output parsed schema as JSON to the specified file
  --docs, -d <file>    Generate markdown documentation to the specified file

Example:
  node ts-parser.js schema.ts --json schema.json --docs schema.md
  `);
    process.exit(0);
  }
  
  // Validate input file
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file "${inputFile}" does not exist`);
    process.exit(1);
  }
  
  try {
    // Parse the schema
    const schema = parseMCPSchema(inputFile);
    
    // Print summary
    console.log('\nSchema Summary:');
    console.log(`- Protocol Version: ${schema.version}`);
    console.log(`- Interfaces: ${schema.summary.interfaceCount}`);
    console.log(`- Type Aliases: ${schema.summary.typeCount}`);
    console.log(`- Constants: ${schema.summary.constantCount}`);
    
    // Output JSON if requested
    if (outputJson) {
      fs.writeFileSync(outputJson, JSON.stringify(schema, null, 2));
      console.log(`\nJSON schema written to ${outputJson}`);
    }
    
    // Output docs if requested
    if (outputDocs) {
      const markdown = generateMarkdown(schema);
      fs.writeFileSync(outputDocs, markdown);
      console.log(`\nDocumentation written to ${outputDocs}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function if this is the entry point
if (require.main === module) {
  main();
}

// Export for use in other modules
module.exports = {
  parseMCPSchema,
  generateMarkdown
};
