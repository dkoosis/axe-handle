#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { execSync } from 'child_process';

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

// Path mappings to update in all source files - convert to path aliases
const pathMappings = [
  // Convert relative to path aliases
  { from: /from ['"]\.\.\/axe\/schema\/types['"]/g, to: 'from "@axe/schema/types"' },
  { from: /from ['"]\.\.\/axe\/engine\/serverGenerator['"]/g, to: 'from "@axe/engine/serverGenerator"' },
  { from: /from ['"]\.\.\/axe\/engine\/templateSystem['"]/g, to: 'from "@axe/engine/templateSystem"' },
  { from: /from ['"]\.\.\/axe\/engine\/templates\/templateTypes['"]/g, to: 'from "@axe/engine/templates/templateTypes"' },
  { from: /from ['"]\.\.\/axe\/engine\/templates\/templateError['"]/g, to: 'from "@axe/engine/templates/templateError"' },
  { from: /from ['"]\.\.\/axe\/mappings\/resourceMapper['"]/g, to: 'from "@axe/mappings/resourceMapper"' },
  { from: /from ['"]\.\.\/utils\/logger['"]/g, to: 'from "@utils/logger"' },
  { from: /from ['"]\.\.\/utils\/errorUtils['"]/g, to: 'from "@utils/errorUtils"' },
  { from: /from ['"]\.\.\/utils\/validationUtils['"]/g, to: 'from "@utils/validationUtils"' },
  { from: /from ['"]\.\.\/utils\/performanceUtils['"]/g, to: 'from "@utils/performanceUtils"' },
  { from: /from ['"]\.\.\/utils\/errorBoundary['"]/g, to: 'from "@utils/errorBoundary"' },
  { from: /from ['"]\.\.\/utils\/resultUtils['"]/g, to: 'from "@utils/resultUtils"' },
  { from: /from ['"]\.\.\/utils\/configManager['"]/g, to: 'from "@utils/configManager"' },
  { from: /from ['"]\.\.\/generators\/express['"]/g, to: 'from "@generators/express"' },
  { from: /from ['"]\.\.\/generators\/common\/baseGenerator['"]/g, to: 'from "@generators/common/baseGenerator"' },
  
  // Old parser paths
  { from: /from ['"]\.\.\/parser\/protocol['"]/g, to: 'from "@axe/schema/protocolParser"' },
  { from: /from ['"]\.\.\/parser\/serviceParser['"]/g, to: 'from "@axe/schema/serviceParser"' },
  { from: /from ['"]\.\.\/parser\/mcpSchemaAdapter['"]/g, to: 'from "@axe/schema/schemaAdapter"' },
  
  // Old mapper paths
  { from: /from ['"]\.\.\/mcp\/mapper['"]/g, to: 'from "@axe/mappings/resourceMapper"' },
  
  // Old generator paths
  { from: /from ['"]\.\.\/generator\/mcpServerGenerator['"]/g, to: 'from "@axe/engine/serverGenerator"' },
  { from: /from ['"]\.\.\/generator\/generators['"]/g, to: 'from "@generators/express"' },
  
  // Old template system paths
  { from: /from ['"]\.\.\/utils\/templateSystem['"]/g, to: 'from "@axe/engine/templateSystem"' },
  { from: /from ['"]\.\.\/utils\/templates['"]/g, to: 'from "@axe/engine/templates"' },
  
  // Types import
  { from: /from ['"]\.\.\/types['"]/g, to: 'from "@axe/schema/types"' },
  
  // Import declarations
  { from: /import \{ mcpProtocolParser \} from ['"](\.\.\/)?parser\/protocol\/protocolCache['"]/g, to: 'import { mcpProtocolParser } from "@axe/schema/protocolCache"' },
  { from: /import \{ extractMcpProtocol \} from ['"](\.\.\/)?parser\/protocol\/protocolAdapter['"]/g, to: 'import { extractMcpProtocol } from "@axe/schema/protocolAdapter"' },
  { from: /import \{ serviceParser \} from ['"](\.\.\/)?parser\/serviceParser['"]/g, to: 'import { serviceParser } from "@axe/schema/serviceParser"' },
  { from: /import \{ mapper \} from ['"](\.\.\/)?mcp\/mapper['"]/g, to: 'import { mapper } from "@axe/mappings/resourceMapper"' },
  { from: /import \{ mcpServerGenerator \} from ['"](\.\.\/)?generator\/mcpServerGenerator['"]/g, to: 'import { axeServerGenerator } from "@axe/engine/serverGenerator"' },
  { from: /import \{ TemplateSystem, getTemplateSystem \} from ['"](\.\.\/)?utils\/templateSystem['"]/g, to: 'import { TemplateSystem, getTemplateSystem } from "@axe/engine/templateSystem"' },
  
  // Update class names and instances
  { from: /class McpServerGenerator/g, to: 'class AxeServerGenerator' },
  { from: /McpServerGenerator\.getInstance/g, to: 'AxeServerGenerator.getInstance' },
  { from: /export const mcpServerGenerator/g, to: 'export const axeServerGenerator' },
  { from: /const mcpServerGenerator/g, to: 'const axeServerGenerator' },
  { from: /await mcpServerGenerator/g, to: 'await axeServerGenerator' },
  { from: /mcpServerGenerator\./g, to: 'axeServerGenerator.' },
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

// Create module alias registration file
function createModuleAliasRegistration() {
  console.log('Creating module alias registration...');
  const registrationContent = `// src/registerAliases.ts
// Registers module aliases for development with ts-node
import moduleAlias from 'module-alias';
import path from 'path';

// Register module aliases
moduleAlias.addAliases({
  '@axe': path.join(__dirname, 'axe'),
  '@generators': path.join(__dirname, 'generators'),
  '@utils': path.join(__dirname, 'utils'),
  '@templates': path.join(__dirname, '../templates')
});

export {};
`;

  fs.writeFileSync(path.join(srcDir, 'registerAliases.ts'), registrationContent, 'utf8');
  console.log('Created src/registerAliases.ts');
}

// Update index.ts and cli.ts to include module alias registration
function updateEntryFiles() {
  console.log('Updating entry files to use module aliases...');
  
  const entryFiles = ['src/index.ts', 'src/cli.ts'];
  
  entryFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Add import for module aliases registration if not present
      if (!content.includes('registerAliases')) {
        content = `// Register module aliases for path resolution
import './registerAliases';

${content}`;
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file} to use module aliases`);
      }
    } else {
      console.warn(`Warning: Entry file not found: ${file}`);
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

// Update tsconfig.json with path aliases
function updateTsConfig() {
  console.log('Updating tsconfig.json with path aliases...');
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  
  if (fs.existsSync(tsconfigPath)) {
    let tsconfig;
    try {
      tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    } catch (error) {
      console.error('Error parsing tsconfig.json:', error);
      return;
    }
    
    // Add or update paths configuration
    tsconfig.compilerOptions = tsconfig.compilerOptions || {};
    tsconfig.compilerOptions.baseUrl = '.';
    tsconfig.compilerOptions.paths = {
      '@axe/*': ['src/axe/*'],
      '@generators/*': ['src/generators/*'],
      '@utils/*': ['src/utils/*'],
      '@templates/*': ['templates/*']
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
    console.log('Updated tsconfig.json with path aliases');
  } else {
    console.warn('Warning: tsconfig.json not found');
    
    // Create a new tsconfig.json file with path aliases
    const tsconfig = {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@axe/*": ["src/axe/*"],
          "@generators/*": ["src/generators/*"],
          "@utils/*": ["src/utils/*"],
          "@templates/*": ["templates/*"]
        },
        "target": "ES2020",
        "module": "NodeNext",
        "moduleResolution": "NodeNext",
        "esModuleInterop": true,
        "strict": true,
        "declaration": true,
        "sourceMap": true,
        "outDir": "dist",
        "rootDir": "src",
        "forceConsistentCasingInFileNames": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "strictNullChecks": true,
        "resolveJsonModule": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist", "test", "generated", "backup", "archive/*"]
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
    console.log('Created new tsconfig.json with path aliases');
  }
}

// Update package.json with module aliases and scripts
function updatePackageJson() {
  console.log('Updating package.json...');
  const packageJsonPath = path.join(rootDir, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    let packageJson;
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      console.error('Error parsing package.json:', error);
      return;
    }
    
    // Add or update module aliases
    packageJson._moduleAliases = {
      '@axe': 'dist/axe',
      '@generators': 'dist/generators',
      '@utils': 'dist/utils',
      '@templates': 'templates'
    };
    
    // Update scripts to use module-alias
    if (packageJson.scripts) {
      if (packageJson.scripts.dev) {
        packageJson.scripts.dev = 'ts-node -r module-alias/register src/index.ts';
      }
      if (packageJson.scripts.generate) {
        packageJson.scripts.generate = 'ts-node -r module-alias/register src/cli.ts';
      }
    }
    
    // Add module-alias dependency if not already present
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies['module-alias'] = '^2.2.3';
    
    // Add required dev dependencies if not already present
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies['@types/module-alias'] = '^2.0.4';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    console.log('Updated package.json with module aliases and scripts');
  } else {
    console.warn('Warning: package.json not found');
  }
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

// Install required dependencies
function installDependencies() {
  console.log('Installing required dependencies...');
  
  try {
    execSync('npm install module-alias @types/module-alias --save', { stdio: 'inherit' });
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Error installing dependencies:', error);
    console.log('Please manually install dependencies:');
    console.log('npm install module-alias @types/module-alias --save');
  }
}

// Run the refactoring
async function runRefactoring() {
  try {
    console.log('Starting Axe Handle refactoring...');
    
    // Install dependencies first
    installDependencies();
    
    // Backup the current codebase
    createBackup();
    
    // Create the new directory structure
    createNewDirectories();
    
    // Move files to their new locations
    moveFiles();
    
    // Create module alias registration
    createModuleAliasRegistration();
    
    // Update entry files
    updateEntryFiles();
    
    // Update tsconfig.json
    updateTsConfig();
    
    // Update package.json
    updatePackageJson();
    
    // Update path references
    updatePathReferences();
    
    // Create organization summary
    createOrganizationSummary();
    
    // Clean up old files
    cleanupOldFiles();
    
    console.log('Refactoring completed successfully!');
    console.log('Next steps:');
    console.log('1. Run "npm install" to ensure all dependencies are installed');
    console.log('2. Fix any remaining import issues manually if needed');
    console.log('3. Run "npm run dev" to test the refactored codebase');
  } catch (error) {
    console.error('Error during refactoring:', error);
    console.log('You can restore from the backup if needed.');
  }
}

// Run the script
runRefactoring();
