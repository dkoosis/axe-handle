#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

// Configuration
const rootDir = path.resolve(__dirname);
const srcDir = path.join(rootDir, 'src');
const templateDir = path.join(rootDir, 'templates');
const backupDir = path.join(rootDir, 'backup');

// New directory structure
const newDirs = [
  // Axe Handle source structure
  'src/axe/engine',
  'src/axe/schema',
  'src/axe/mappings',
  'src/generators/express',
  'src/generators/common',
  'src/utils',
  
  // Template structure
  'templates/mcp-server/express/src/handlers',
  'templates/mcp-server/express/src/models',
  'templates/mcp-server/express/src/utils',
  'templates/mcp-server/express/docs',
  'templates/mcp-server/express/config',
  'templates/common',
  
  // Examples directory
  'examples/schemas',
  'examples/generated'
];

// File mappings for direct moves (old path -> new path)
const fileMappings = {
  // Parser files
  'src/parser/protocol/index.ts': 'src/axe/schema/protocolParser.ts',
  'src/parser/protocol/protocolCache.ts': 'src/axe/schema/protocolCache.ts',
  'src/parser/protocol/protocolAdapter.ts': 'src/axe/schema/protocolAdapter.ts',
  'src/parser/serviceParser.ts': 'src/axe/schema/serviceParser.ts',
  'src/parser/mcpSchemaAdapter.ts': 'src/axe/schema/schemaAdapter.ts',
  
  // Mapper files
  'src/mcp/mapper.ts': 'src/axe/mappings/resourceMapper.ts',
  
  // Generator files
  'src/generator/mcpServerGenerator.ts': 'src/axe/engine/serverGenerator.ts',
  'src/generator/generators/baseGenerator.ts': 'src/generators/common/baseGenerator.ts',
  'src/generator/generators/documentationGenerator.ts': 'src/generators/express/documentationGenerator.ts',
  'src/generator/generators/handlerGenerator.ts': 'src/generators/express/handlerGenerator.ts',
  'src/generator/generators/indexGenerator.ts': 'src/generators/express/indexGenerator.ts',
  'src/generator/generators/projectFilesGenerator.ts': 'src/generators/express/projectFilesGenerator.ts',
  'src/generator/generators/serverGenerator.ts': 'src/generators/express/serverGenerator.ts',
  'src/generator/generators/typesGenerator.ts': 'src/generators/express/typesGenerator.ts',
  'src/generator/generators/index.ts': 'src/generators/express/index.ts',
  
  // Utility files
  'src/utils/errorUtils.ts': 'src/utils/errorUtils.ts',
  'src/utils/errorBoundary.ts': 'src/utils/errorBoundary.ts',
  'src/utils/logger.ts': 'src/utils/logger.ts',
  'src/utils/performanceUtils.ts': 'src/utils/performanceUtils.ts',
  'src/utils/resultUtils.ts': 'src/utils/resultUtils.ts',
  'src/utils/validationUtils.ts': 'src/utils/validationUtils.ts',
  'src/utils/configManager.ts': 'src/utils/configManager.ts',
  
  // Template system files
  'src/utils/templateSystem.ts': 'src/axe/engine/templateSystem.ts',
  'src/utils/templates/templateError.ts': 'src/axe/engine/templates/templateError.ts',
  'src/utils/templates/templateLoader.ts': 'src/axe/engine/templates/templateLoader.ts',
  'src/utils/templates/templateRenderer.ts': 'src/axe/engine/templates/templateRenderer.ts',
  'src/utils/templates/templateResolver.ts': 'src/axe/engine/templates/templateResolver.ts',
  'src/utils/templates/templateTypes.ts': 'src/axe/engine/templates/templateTypes.ts',
  
  // Root files
  'src/cli.ts': 'src/cli.ts',
  'src/index.ts': 'src/index.ts',
  'src/types.ts': 'src/axe/schema/types.ts',
  
  // Templates
  'templates/server.eta': 'templates/mcp-server/express/src/server.eta',
  'templates/handler.eta': 'templates/mcp-server/express/src/handlers/handler.eta',
  'templates/types.eta': 'templates/mcp-server/express/src/types.eta',
  'templates/index.eta': 'templates/mcp-server/express/src/index.eta',
  'templates/api.eta': 'templates/mcp-server/express/docs/api.eta',
  
  // Express templates
  'templates/express/package.json.eta': 'templates/mcp-server/express/package.json.eta',
  'templates/express/server/server.eta': 'templates/mcp-server/express/src/server.eta',
  'templates/express/handler/handler.eta': 'templates/mcp-server/express/src/handlers/handler.eta',
  'templates/express/types/types.eta': 'templates/mcp-server/express/src/types.eta',
  'templates/express/index/index.eta': 'templates/mcp-server/express/src/index.eta',
  'templates/express/api/api.eta': 'templates/mcp-server/express/docs/api.eta',
  'templates/express/src/handlers/connectionHandler.ts.eta': 'templates/mcp-server/express/src/handlers/connectionHandler.eta',
  'templates/express/src/handlers/messageHandler.ts.eta': 'templates/mcp-server/express/src/handlers/messageHandler.eta',
  'templates/express/src/handlers/request-handler.ts.eta': 'templates/mcp-server/express/src/handlers/requestHandler.eta',
  'templates/express/src/utils/errorHandler.ts.eta': 'templates/mcp-server/express/src/utils/errorHandler.eta',
  'templates/express/src/utils/logger.ts.eta': 'templates/mcp-server/express/src/utils/logger.eta',
};

// Files to delete after moving (won't be needed in the new structure)
const filesToDelete = [
  'src/parser/mcpProtocolParser.ts',
  'src/generator/plan.md',
  'src/direct-refactoring-approach.txt',
  'src/docs/gts-integration.md',
  'src/docs/neverthrow-implementation-plan.md',
  'src/docs/neverthrow-readme.md',
  'src/examples/resultCli.ts',
  'src/examples/resultExample.ts',
  'src/examples/resultUtilsExamples.ts',
];

// Path mappings to update in all source files
const pathMappings = [
  // Parser imports
  { from: /from ['"]\.\.\/parser\/protocol['"]/g, to: 'from "../axe/schema/protocolParser"' },
  { from: /from ['"]\.\.\/parser\/serviceParser['"]/g, to: 'from "../axe/schema/serviceParser"' },
  { from: /import \{ mcpProtocolParser \} from ['"]\.\.\/parser\/protocol\/protocolCache['"]/g, to: 'import { mcpProtocolParser } from "../axe/schema/protocolCache"' },
  
  // Mapper imports
  { from: /from ['"]\.\.\/mcp\/mapper['"]/g, to: 'from "../axe/mappings/resourceMapper"' },
  { from: /import \{ mapper \} from ['"]\.\.\/mcp\/mapper['"]/g, to: 'import { mapper } from "../axe/mappings/resourceMapper"' },
  
  // Generator imports
  { from: /from ['"]\.\.\/generator\/mcpServerGenerator['"]/g, to: 'from "../axe/engine/serverGenerator"' },
  { from: /import \{ mcpServerGenerator \} from ['"]\.\.\/generator\/mcpServerGenerator['"]/g, to: 'import { mcpServerGenerator } from "../axe/engine/serverGenerator"' },
  
  // Generator component imports
  { from: /from ['"]\.\.\/generator\/generators['"]/g, to: 'from "../generators/express"' },
  { from: /from ['"]\.\.\/generator\/generators\/baseGenerator['"]/g, to: 'from "../generators/common/baseGenerator"' },
  
  // Types imports
  { from: /from ['"]\.\.\/types['"]/g, to: 'from "../axe/schema/types"' },
  
  // Template system imports
  { from: /from ['"]\.\.\/utils\/templateSystem['"]/g, to: 'from "../axe/engine/templateSystem"' },
  { from: /from ['"]\.\.\/utils\/templates['"]/g, to: 'from "../axe/engine/templates"' },
  { from: /import \{ TemplateSystem, getTemplateSystem \} from ['"]\.\.\/utils\/templateSystem['"]/g, to: 'import { TemplateSystem, getTemplateSystem } from "../axe/engine/templateSystem"' },
  
  // Template component imports
  { from: /from ['"]\.\.\/utils\/templates\/templateTypes['"]/g, to: 'from "../axe/engine/templates/templateTypes"' },
  { from: /from ['"]\.\.\/utils\/templates\/templateError['"]/g, to: 'from "../axe/engine/templates/templateError"' },
  
  // Update class names
  { from: /class McpServerGenerator/g, to: 'class AxeServerGenerator' },
  { from: /McpServerGenerator\.getInstance/g, to: 'AxeServerGenerator.getInstance' },
  { from: /export const mcpServerGenerator/g, to: 'export const axeServerGenerator' },
  
  // Update variable/instance names
  { from: /const mcpServerGenerator/g, to: 'const axeServerGenerator' },
  { from: /await mcpServerGenerator/g, to: 'await axeServerGenerator' },
];

// Create a backup of the current codebase
function createBackup() {
  console.log('Creating backup...');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copy src directory
  fs.cpSync(srcDir, path.join(backupDir, 'src'), { recursive: true });
  
  // Copy templates directory
  fs.cpSync(templateDir, path.join(backupDir, 'templates'), { recursive: true });
  
  console.log(`Backup created at ${backupDir}`);
}

// Create the new directory structure
function createNewDirectories() {
  console.log('Creating new directory structure...');
  newDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Move files to their new locations
function moveFiles() {
  console.log('Moving files to new locations...');
  
  Object.entries(fileMappings).forEach(([oldPath, newPath]) => {
    const fullOldPath = path.join(rootDir, oldPath);
    const fullNewPath = path.join(rootDir, newPath);
    
    if (fs.existsSync(fullOldPath)) {
      // Ensure the target directory exists
      const newDir = path.dirname(fullNewPath);
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(fullOldPath, fullNewPath);
      console.log(`Moved: ${oldPath} -> ${newPath}`);
    } else {
      console.warn(`Warning: Source file not found: ${oldPath}`);
    }
  });
}

// Update path references within files
function updatePathReferences() {
  console.log('Updating path references in files...');
  
  // Get all TypeScript files in the new structure
  const tsFiles = glob.sync('src/**/*.ts', { cwd: rootDir });
  
  tsFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // Apply path mappings
    pathMappings.forEach(mapping => {
      const originalContent = content;
      content = content.replace(mapping.from, mapping.to);
      if (content !== originalContent) {
        modified = true;
      }
    });
    
    // Update paths to relative imports
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated references in: ${file}`);
    }
  });
}

// Clean up old files
function cleanupOldFiles() {
  console.log('Cleaning up old files...');
  
  // Delete unnecessary files
  filesToDelete.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted: ${file}`);
    }
  });
  
  // Delete old empty directories (bottom-up to handle nested directories)
  const dirsToCheck = [
    'src/parser/protocol',
    'src/parser',
    'src/generator/generators',
    'src/generator',
    'src/mcp',
    'src/utils/templates',
    'templates/express/src/handlers',
    'templates/express/src/utils',
    'templates/express/src',
    'templates/express/server',
    'templates/express/handler',
    'templates/express/types',
    'templates/express/index',
    'templates/express/api',
    'templates/express'
  ];
  
  dirsToCheck.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      try {
        // Try to remove directory (will only succeed if empty)
        fs.rmdirSync(fullPath);
        console.log(`Removed empty directory: ${dir}`);
      } catch (error) {
        console.log(`Directory not empty or error: ${dir}`);
      }
    }
  });
}

// Update import handling in files with regex transformations
function fixCircularDependencies() {
  console.log('Fixing potential circular dependencies...');
  
  // Special handling for specific files
  const fixups = {
    'src/index.ts': [
      { 
        from: /import \{ mcpServerGenerator \} from ['"]\.\.\/axe\/engine\/serverGenerator['"]/g, 
        to: 'import { axeServerGenerator } from "./axe/engine/serverGenerator"' 
      },
      {
        from: /await mcpServerGenerator\.generateServer/g,
        to: 'await axeServerGenerator.generateServer'
      }
    ],
    'src/cli.ts': [
      {
        from: /import \{ mcpServerGenerator \} from ['"]\.\.\/axe\/engine\/serverGenerator['"]/g,
        to: 'import { axeServerGenerator } from "./axe/engine/serverGenerator"'
      }
    ]
  };
  
  Object.entries(fixups).forEach(([file, replacements]) => {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      replacements.forEach(replacement => {
        const originalContent = content;
        content = content.replace(replacement.from, replacement.to);
        if (content !== originalContent) {
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Applied special fixes to: ${file}`);
      }
    }
  });
}

// Function to create a file with the new organization summary
function createOrganizationSummary() {
  console.log('Creating organization summary...');
  
  const summary = `# Axe Handle Project Organization

## Directory Structure

\`\`\`
axe-handle/
├── src/                          # Generator source code
│   ├── axe/                      # Core Axe Handle components
│   │   ├── engine/               # Code generation engine
│   │   ├── schema/               # Schema parsing and validation
│   │   └── mappings/             # Schema-to-server mappings
│   ├── generators/               # Generator implementations
│   │   ├── express/              # Express-specific generators
│   │   └── common/               # Shared generator components
│   ├── utils/                    # Shared utilities
│   ├── cli.ts                    # Command-line interface
│   └── index.ts                  # Main API
├── templates/                    # Templates for generated code
│   ├── mcp-server/               # MCP server templates
│   │   ├── express/              # Express framework templates
│   │   │   ├── src/              # Server source
│   │   │   ├── config/           # Server configuration
│   │   │   └── docs/             # Server documentation
│   │   └── [future frameworks]
│   └── common/                   # Shared templates
└── examples/                     # Example schemas and generated code
\`\`\`

## Naming Conventions

- **Prefixes**:
  - \`Axe*\` for generator components (e.g., \`AxeServerGenerator\`)
  - \`Mcp*\` for generated server components (e.g., \`McpResourceHandler\`)

- **Suffixes**:
  - \`*Generator.ts\` for code generators
  - \`*Parser.ts\` for schema parsers
  - \`*.eta\` for templates (no .ts in template filenames)

## Component Overview

### Axe Handle (Generator)
- Schema parsing and validation
- Resource and service mapping
- Code generation engine
- Template system

### MCP Server (Generated)
- Express-based server implementation
- Resource handlers
- WebSocket support
- API documentation
`;

  fs.writeFileSync(path.join(rootDir, 'ORGANIZATION.md'), summary, 'utf8');
  console.log('Created organization summary: ORGANIZATION.md');
}

// Run the refactoring
async function runRefactoring() {
  try {
    console.log('Starting Axe Handle refactoring...');
    
    // Backup the current codebase
    createBackup();
    
    // Create the new directory structure
    createNewDirectories();
    
    // Move files to their new locations
    moveFiles();
    
    // Update path references
    updatePathReferences();
    
    // Fix potential circular dependencies
    fixCircularDependencies();
    
    // Create organization summary
    createOrganizationSummary();
    
    // Clean up old files
    cleanupOldFiles();
    
    console.log('Refactoring completed successfully!');
  } catch (error) {
    console.error('Error during refactoring:', error);
    console.log('You can restore from the backup if needed.');
  }
}

// Run the script
runRefactoring();
