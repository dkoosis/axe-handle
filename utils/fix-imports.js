const fs = require('fs');
const path = require('path');

// Map of old paths to new paths
const pathMappings = {
  '../types': '../types/index',
  '../utils/templates/templateSystem': '../templateProcessor/templateProcessor',
  '../utils/templates/templateLoader': '../templateProcessor/templateLoader',
  '../utils/templates/templateRenderer': '../templateProcessor/templateRenderer',
  '../parser/protocol': '../parsers/modelContextProtocol',
  '../engine/mcpServerGenerator': '../mcpServerGenerator/serverGenerator',
  '../generator/mcpServerGenerator': '../mcpServerGenerator/handlerGenerator',
  './generator/mcpServerGenerator': './mcpServerGenerator/handlerGenerator',
  './engine/mcpServerGenerator': './mcpServerGenerator/serverGenerator'
};

// Path mappings for deeply nested directories
const deepMappings = {
  '../../types': '../../types/index',
  '../../utils/templates/templateSystem': '../../templateProcessor/templateProcessor',
  '../../utils/templates/templateLoader': '../../templateProcessor/templateLoader',
  '../../utils/templates/templateRenderer': '../../templateProcessor/templateRenderer',
  '../../parser/protocol': '../../parsers/modelContextProtocol',
  '../../engine/mcpServerGenerator': '../../mcpServerGenerator/serverGenerator',
  '../../generator/mcpServerGenerator': '../../mcpServerGenerator/handlerGenerator',
};

// Function to process a file and update imports
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check file extension
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
      return;
    }
    
    console.log(`Processing file: ${filePath}`);
    
    // Apply regular mappings
    for (const [oldPath, newPath] of Object.entries(pathMappings)) {
      const importRegex = new RegExp(`from ['"](${oldPath})['"]`, 'g');
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `from '${newPath}'`);
        modified = true;
      }
    }
    
    // Apply deep mappings
    for (const [oldPath, newPath] of Object.entries(deepMappings)) {
      const importRegex = new RegExp(`from ['"](${oldPath})['"]`, 'g');
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `from '${newPath}'`);
        modified = true;
      }
    }
    
    // Save the file if it was modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Function to recursively process all files in a directory
function processDirectory(directory) {
  const items = fs.readdirSync(directory);
  
  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // Skip node_modules and .git directories
      if (item !== 'node_modules' && item !== '.git') {
        processDirectory(itemPath);
      }
    } else {
      updateImportsInFile(itemPath);
    }
  }
}

// Start processing from the src directory
console.log('Starting import path fixes...');
processDirectory('./src');
console.log('Import paths updated!');
