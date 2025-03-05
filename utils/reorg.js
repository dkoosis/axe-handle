"use strict";
// reorg.ts - Script to reorganize the project structure
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
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var chalk = __importStar(require("chalk"));
// Progress tracking
var totalFiles = 0;
var processedFiles = 0;
// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
    var parts = dirPath.split(path.sep);
    var currentPath = '';
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        currentPath = currentPath ? path.join(currentPath, part) : part;
        if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath);
            console.log(chalk.green("Created directory: ".concat(currentPath)));
        }
    }
}
// Function to clean existing header comments and add new one
function processFileContent(filePath, content) {
    // Skip if it's not a source file
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
        return content;
    }
    // Remove any existing path comments
    var lines = content.split('\n');
    while (lines.length > 0 && lines[0].trim().startsWith('// Path:')) {
        lines.shift();
    }
    // Add the correct header comment
    return "// Path: ".concat(filePath, "\n").concat(lines.join('\n'));
}
// Function to update imports to use path aliases
function updateImports(filePath, content) {
    // Define path alias mappings
    var aliasMap = {
        '@cli': 'src/cli',
        '@engine': 'src/engine',
        '@parser': 'src/parser',
        '@types': 'src/types',
        '@utils': 'src/utils',
        '@templates': 'templates'
    };
    // Replace relative imports with alias imports
    var updatedContent = content;
    var importsUpdated = 0;
    // This is a simplified approach - a proper implementation would need to parse the TypeScript AST
    // Here we're using regex for simplicity, but it's not perfect
    // Current directory for the file
    var fileDir = path.dirname(filePath);
    var _loop_1 = function (alias, targetPath) {
        var relativePathToTarget = path.relative(fileDir, targetPath);
        // Replace import statements like "import x from '../utils/y'" with "import x from '@utils/y'"
        var importRegex = new RegExp("import (.+?) from ['\"](\\.\\.?\\/.*?".concat(targetPath.split('/').pop(), ".*?)['\"]"), 'g');
        var oldContent = updatedContent;
        updatedContent = updatedContent.replace(importRegex, function (match, importNames, importPath) {
            // Extract the part after the module path
            var modulePathParts = importPath.split(path.basename(targetPath));
            var pathSuffix = modulePathParts.length > 1 ? modulePathParts[1] : '';
            return "import ".concat(importNames, " from '").concat(alias).concat(pathSuffix, "'");
        });
        if (oldContent !== updatedContent) {
            importsUpdated++;
        }
    };
    for (var _i = 0, _a = Object.entries(aliasMap); _i < _a.length; _i++) {
        var _b = _a[_i], alias = _b[0], targetPath = _b[1];
        _loop_1(alias, targetPath);
    }
    if (importsUpdated > 0) {
        console.log(chalk.cyan("  - Updated ".concat(importsUpdated, " import paths")));
    }
    return updatedContent;
}
// Function to write content to a file
function writeFile(targetPath, content) {
    // Ensure target directory exists
    var targetDir = path.dirname(targetPath);
    ensureDirectoryExists(targetDir);
    // Write content to file
    fs.writeFileSync(targetPath, content);
    processedFiles++;
    updateProgress();
}
// Function to update progress
function updateProgress() {
    var percentage = Math.floor((processedFiles / totalFiles) * 100);
    process.stdout.write("\r".concat(chalk.yellow("Progress: ".concat(percentage, "%")), " (").concat(processedFiles, "/").concat(totalFiles, ")"));
}
// Function to count total files
function countTotalFiles() {
    var count = fileMapping.length;
    // Add templates
    var countFilesInDir = function (dirPath) {
        if (!fs.existsSync(dirPath))
            return 0;
        var fileCount = 0;
        var entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            var fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                fileCount += countFilesInDir(fullPath);
            }
            else {
                fileCount++;
            }
        }
        return fileCount;
    };
    // Count template files
    var templateDirs = ['templates/express', 'templates/mcp-server/express'];
    for (var _i = 0, templateDirs_1 = templateDirs; _i < templateDirs_1.length; _i++) {
        var dir = templateDirs_1[_i];
        count += countFilesInDir(dir);
    }
    return count;
}
// File mapping definition
var fileMapping = [
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
function updateTsConfig() {
    var tsConfigPath = 'tsconfig.json';
    if (!fs.existsSync(tsConfigPath)) {
        console.warn(chalk.yellow("No tsconfig.json found to update path aliases"));
        return;
    }
    try {
        var tsConfigContent = fs.readFileSync(tsConfigPath, 'utf-8');
        var tsConfig = JSON.parse(tsConfigContent);
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
    }
    catch (error) {
        console.error(chalk.red("Failed to update tsconfig.json:"), error);
    }
}
// Process templates
function processTemplates() {
    console.log(chalk.blue("\nProcessing templates..."));
    // Create templates directory
    ensureDirectoryExists('templates/express');
    // Source directories for templates
    var sourceDirs = [
        'templates/express',
        'templates/mcp-server/express'
    ];
    for (var _i = 0, sourceDirs_1 = sourceDirs; _i < sourceDirs_1.length; _i++) {
        var sourceDir = sourceDirs_1[_i];
        if (!fs.existsSync(sourceDir))
            continue;
        console.log(chalk.blue("Processing template directory: ".concat(sourceDir)));
        // Process all templates in the directory
        processDirectory(sourceDir, 'templates/express');
    }
}
// Recursively process a directory
function processDirectory(sourceDir, targetDir) {
    if (!fs.existsSync(sourceDir))
        return;
    // Create target directory
    ensureDirectoryExists(targetDir);
    // Read source directory
    var entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    for (var _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
        var entry = entries_2[_i];
        var srcPath = path.join(sourceDir, entry.name);
        var tgtPath = path.join(targetDir, entry.name);
        if (entry.isDirectory()) {
            // Process subdirectory
            processDirectory(srcPath, tgtPath);
        }
        else {
            // Process file
            console.log(chalk.cyan("  Processing template: ".concat(srcPath, " \u2192 ").concat(tgtPath)));
            var content = fs.readFileSync(srcPath, 'utf-8');
            content = processFileContent(tgtPath, content);
            writeFile(tgtPath, content);
        }
    }
}
// Main execution function
function runReorganization() {
    console.log(chalk.bold.green("Starting project reorganization..."));
    // Count total files
    totalFiles = countTotalFiles();
    console.log(chalk.blue("Total files to process: ".concat(totalFiles)));
    // Update tsconfig with path aliases
    updateTsConfig();
    // Process all files in the mapping
    console.log(chalk.blue("\nProcessing source files..."));
    for (var _i = 0, fileMapping_1 = fileMapping; _i < fileMapping_1.length; _i++) {
        var _a = fileMapping_1[_i], sourcePath = _a[0], targetPath = _a[1];
        console.log(chalk.cyan("Processing: ".concat(sourcePath, " \u2192 ").concat(targetPath)));
        if (!fs.existsSync(sourcePath)) {
            console.warn(chalk.yellow("  Source file not found: ".concat(sourcePath)));
            processedFiles++; // Still count it for progress
            updateProgress();
            continue;
        }
        // Read content
        var content = fs.readFileSync(sourcePath, 'utf-8');
        // Process content
        content = processFileContent(targetPath, content);
        content = updateImports(targetPath, content);
        // Write to target location
        writeFile(targetPath, content);
    }
    // Process templates
    processTemplates();
    console.log(chalk.bold.green("\nProject reorganization complete!"));
    console.log(chalk.bold("Processed ".concat(processedFiles, " files out of ").concat(totalFiles, " total")));
}
// Execute the reorganization
runReorganization();
