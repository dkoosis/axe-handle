// reorg.ts - Script to reorganize the project structure

import * as fs from 'fs';
import * as path from 'path';
const chalk = require('chalk');

// Progress tracking
let totalFiles = 0;
let processedFiles = 0;

// Function to ensure directory exists
function ensureDirectoryExists(dirPath: string): void {
  const parts = dirPath.split(path.sep);
  let currentPath = '';
  
  for (const part of parts) {
    currentPath = currentPath ? path.join(currentPath, part) : part;
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
      console.log(chalk.green(`Created directory: ${currentPath}`));
    }
  }
}

// Function to clean existing header comments and add new one
function processFileContent(filePath: string, content: string): string {
  // Skip if it's not a source file
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
    return content;
  }
  
  // Remove any existing path comments
  let lines = content.split('\n');
  while (lines.length > 0 && lines[0].trim().startsWith('// Path:')) {
    lines.shift();
  }
  
  // Add the correct header comment
  return `// Path: ${filePath}\n${lines.join('\n')}`;
}

// Function to update imports to use path aliases
function updateImports(filePath: string, content: string): string {
  // Define path alias mappings
  const aliasMap: Record<string, string> = {
    '@cli': 'src/cli',
    '@engine': 'src/engine',
    '@parser': 'src/parser',
    '@types': 'src/types',
    '@utils': 'src/utils',
    '@templates': 'templates'
  };
  
  // Replace relative imports with alias imports
  let updatedContent = content;
  let importsUpdated = 0;
  
  // This is a simplified approach - a proper implementation would need to parse the TypeScript AST
  // Here we're using regex for simplicity, but it's not perfect
  
  // Current directory for the file
  const fileDir = path.dirname(filePath);
  
  for (const [alias, targetPath] of Object.entries(aliasMap)) {
    const relativePathToTarget = path.relative(fileDir, targetPath);
    
    // Replace import statements like "import x from '../utils/y'" with "import x from '@utils/y'"
    const importRegex = new RegExp(`import (.+?) from ['"](\\.\\.?\\/.*?${targetPath.split('/').pop()}.*?)['"]`, 'g');
    const oldContent = updatedContent;
    updatedContent = updatedContent.replace(importRegex, (match, importNames, importPath) => {
      // Extract the part after the module path
      const modulePathParts = importPath.split(path.basename(targetPath));
      const pathSuffix = modulePathParts.length > 1 ? modulePathParts[1] : '';
      return `import ${importNames} from '${alias}${pathSuffix}'`;
    });
    
    if (oldContent !== updatedContent) {
      importsUpdated++;
    }
  }
  
  if (importsUpdated > 0) {
    console.log(chalk.cyan(`  - Updated ${importsUpdated} import paths`));
  }
  
  return updatedContent;
}

// Function to write content to a file
function writeFile(targetPath: string, content: string): void {
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  ensureDirectoryExists(targetDir);
  
  // Write content to file
  fs.writeFileSync(targetPath, content);
  processedFiles++;
  updateProgress();
}

// Function to update progress
function updateProgress(): void {
  const percentage = Math.floor((processedFiles / totalFiles) * 100);
  process.stdout.write(`\r${chalk.yellow(`Progress: ${percentage}%`)} (${processedFiles}/${totalFiles})`);
}

// Function to count total files
function countTotalFiles(): number {
  let count = fileMapping.length;
  
  // Add templates
  const countFilesInDir = (dirPath: string): number => {
    if (!fs.existsSync(dirPath)) return 0;
    
    let fileCount = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        fileCount += countFilesInDir(fullPath);
      } else {
        fileCount++;
      }
    }
    
    return fileCount;
  };
  
  // Count template files
  const templateDirs = ['templates/express', 'templates/mcp-server/express'];
  for (const dir of templateDirs) {
    count += countFilesInDir(dir);
  }
  
  return count;
}

// File mapping definition
const fileMapping: [string, string][] = [
  // Config files
  ['package.json', 'package.json'],
  ['tsconfig.json', 'tsconfig.json'],
  ['.eslintrc.json', '.eslintrc.json'],
  ['.prettierrc.js', '.prettierrc.js'],
  
  // Source files
  ['src/cli.ts', 'src/cli/index.ts'],
  ['src/index.ts', 'src/index.ts'],
  ['src/registerAliases.ts', 'src/utils/registerAliases.ts'],
  
  // Engine files
  ['src/generator/mcpServerGenerator.ts', 'src/engine/mcpServerGenerator.ts'],
  ['src/generators/common/baseGenerator.ts', 'src/engine/generators/common/baseGenerator.ts'],
  ['src/generators/express/serverGenerator.ts', 'src/engine/generators/express/serverGenerator.ts'],
  ['src/generators/express/handlerGenerator.ts', 'src/engine/generators/express/handlerGenerator.ts'],
  ['src/generators/express/typesGenerator.ts', 'src/engine/generators/express/typesGenerator.ts'],
  ['src/generators/express/indexGenerator.ts', 'src/engine/generators/express/indexGenerator.ts'],
  ['src/generators/express/documentationGenerator.ts', 'src/engine/generators/express/documentationGenerator.ts'],
  ['src/generators/express/projectFilesGenerator.ts', 'src/engine/generators/express/projectFilesGenerator.ts'],
  
  // Parser files
  ['src/parser/mcpSchemaAdapter.ts', 'src/parser/protocol/adapter.ts'],
  ['src/parser/protocol/index.ts', 'src/parser/protocol/index.ts'],
  ['src/parser/protocol/protocolCache.ts', 'src/parser/protocol/cache.ts'],
  ['src/parser/protocol/protocolAdapter.ts', 'src/parser/protocol/adapter.ts'],
  ['src/parser/serviceParser.ts', 'src/parser/services/serviceParser.ts'],
  
  // Types files
  ['src/types.ts', 'src/types/index.ts'],
  ['src/types/schemaTypes.ts', 'src/types/schema.ts'],
  
  // Utility files
  ['src/utils/logger.ts', 'src/utils/logger.ts'],
  ['src/utils/errorUtils.ts', 'src/utils/errorUtils.ts'],
  ['src/utils/errorBoundary.ts', 'src/utils/errorBoundary.ts'],
  ['src/utils/configManager.ts', 'src/utils/configManager.ts'],
  ['src/utils/performanceUtils.ts', 'src/utils/performanceUtils.ts'],
  ['src/utils/validationUtils.ts', 'src/utils/validationUtils.ts'],
  ['src/utils/resultUtils.ts', 'src/utils/resultUtils.ts'],
  ['src/utils/templateSystem.ts', 'src/utils/templates/templateSystem.ts'],
  ['src/utils/templates/templateLoader.ts', 'src/utils/templates/templateLoader.ts'],
  ['src/utils/templates/templateRenderer.ts', 'src/utils/templates/templateRenderer.ts'],
  ['src/utils/templates/templateResolver.ts', 'src/utils/templates/templateResolver.ts'],
  ['src/utils/templates/templateError.ts', 'src/utils/templates/templateError.ts'],
  ['src/utils/templates/templateTypes.ts', 'src/utils/templates/templateTypes.ts'],
];

// Implement path aliases in tsconfig.json
function updateTsConfig(): void {
  const tsConfigPath = 'tsconfig.json';
  if (!fs.existsSync(tsConfigPath)) {
    console.warn(chalk.yellow("No tsconfig.json found to update path aliases"));
    return;
  }
  
  try {
    const tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
    const tsConfig = JSON.parse(tsConfigContent);
    
    // Add path aliases
    tsConfig.compilerOptions = tsConfig.compilerOptions || {};
    tsConfig.compilerOptions.baseUrl = '.';
    tsConfig.compilerOptions.paths = {
      "@cli/*": ["src/cli/*"],
      "@engine/*": ["src/engine/*"],
      "@parser/*": ["src/parser/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@templates/*": ["templates/*"]
    };
    
    // Write updated tsconfig
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    console.log(chalk.green("Updated path aliases in tsconfig.json"));
  } catch (error) {
    console.error(chalk.red("Failed to update tsconfig.json:"), error);
  }
}

// Process templates
function processTemplates(): void {
  console.log(chalk.blue("\nProcessing templates..."));
  
  // Create templates directory
  ensureDirectoryExists('templates/express');
  
  // Source directories for templates
  const sourceDirs = [
    'templates/express',
    'templates/mcp-server/express'
  ];
  
  for (const sourceDir of sourceDirs) {
    if (!fs.existsSync(sourceDir)) continue;
    
    console.log(chalk.blue(`Processing template directory: ${sourceDir}`));
    
    // Process all templates in the directory
    processDirectory(sourceDir, 'templates/express');
  }
}

// Recursively process a directory
function processDirectory(sourceDir: string, targetDir: string): void {
  if (!fs.existsSync(sourceDir)) return;
  
  // Create target directory
  ensureDirectoryExists(targetDir);
  
  // Read source directory
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);
    const tgtPath = path.join(targetDir, entry.name);
    
    if (entry.isDirectory()) {
      // Process subdirectory
      processDirectory(srcPath, tgtPath);
    } else {
      // Process file
      console.log(chalk.cyan(`  Processing template: ${srcPath} → ${tgtPath}`));
      let content = fs.readFileSync(srcPath, 'utf-8');
      content = processFileContent(tgtPath, content);
      writeFile(tgtPath, content);
    }
  }
}

// Main execution function
function runReorganization(): void {
  console.log(chalk.bold.green("Starting project reorganization..."));
  
  // Count total files
  totalFiles = countTotalFiles();
  console.log(chalk.blue(`Total files to process: ${totalFiles}`));
  
  // Update tsconfig with path aliases
  updateTsConfig();
  
  // Process all files in the mapping
  console.log(chalk.blue("\nProcessing source files..."));
  for (const [sourcePath, targetPath] of fileMapping) {
    console.log(chalk.cyan(`Processing: ${sourcePath} → ${targetPath}`));
    
    if (!fs.existsSync(sourcePath)) {
      console.warn(chalk.yellow(`  Source file not found: ${sourcePath}`));
      processedFiles++; // Still count it for progress
      updateProgress();
      continue;
    }
    
    // Read content
    let content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Process content
    content = processFileContent(targetPath, content);
    content = updateImports(targetPath, content);
    
    // Write to target location
    writeFile(targetPath, content);
  }
  
  // Process templates
  processTemplates();
  
  console.log(chalk.bold.green("\nProject reorganization complete!"));
  console.log(chalk.bold(`Processed ${processedFiles} files out of ${totalFiles} total`));
}

// Execute the reorganization
runReorganization();
