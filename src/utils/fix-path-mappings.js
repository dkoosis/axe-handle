#!/usr/bin/env node
// Path: src/utils/fix-path-mappings.js
 * Script to fix path mappings in tsconfig.json
 */

const fs = require('fs');
const path = require('path');

// Config
const PROJECT_ROOT = path.resolve(__dirname);
const TSCONFIG_PATH = path.join(PROJECT_ROOT, 'tsconfig.json');

function updateTsConfigPaths() {
  console.log('Updating path mappings in tsconfig.json...');
  
  try {
    const tsConfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf-8'));
    
    // Ensure we have compilerOptions and paths
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }
    
    if (!tsConfig.compilerOptions.baseUrl) {
      tsConfig.compilerOptions.baseUrl = '.';
    }
    
    // Create comprehensive path mappings based on project structure
    tsConfig.compilerOptions.paths = {
      "@axe/*": ["src/axe/*"],
      "@generators/*": ["src/generators/*"],
      "@utils/*": ["src/utils/*"],
      "@templates/*": ["templates/*"],
      "@parser/*": ["src/parser/*"],
      "@parser/protocol": ["src/parser/protocol/index.ts"],
      "@parser/serviceParser": ["src/parser/serviceParser.ts"]
    };
    
    // Write updated config
    fs.writeFileSync(TSCONFIG_PATH, JSON.stringify(tsConfig, null, 2) + '\n');
    console.log('Successfully updated path mappings in tsconfig.json');
    
    return true;
  } catch (error) {
    console.error('Error updating tsconfig.json:', error);
    return false;
  }
}

function checkImportPaths() {
  console.log('Checking imports in src/index.ts...');
  
  const INDEX_FILE_PATH = path.join(PROJECT_ROOT, 'src', 'index.ts');
  
  try {
    if (!fs.existsSync(INDEX_FILE_PATH)) {
      console.error(`File does not exist: ${INDEX_FILE_PATH}`);
      return false;
    }
    
    const content = fs.readFileSync(INDEX_FILE_PATH, 'utf-8');
    
    // Print current import statements for debugging
    const importLines = content.split('\n')
      .filter(line => line.trim().startsWith('import '));
    
    console.log('Current import statements in src/index.ts:');
    importLines.forEach(line => console.log(`  ${line.trim()}`));
    
    return true;
  } catch (error) {
    console.error('Error checking import paths:', error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting path mappings fix...');
  
  const tsConfigUpdated = updateTsConfigPaths();
  const importsChecked = checkImportPaths();
  
  if (tsConfigUpdated) {
    console.log('\nPath mappings updated successfully!');
    console.log('Try running "npm run dev" again.');
    
    if (importsChecked) {
      console.log('\nNote: If you still experience issues, verify these import paths exist:');
      console.log('  - src/parser/protocol/index.ts');
      console.log('  - src/parser/serviceParser.ts');
    }
  } else {
    console.log('Failed to update path mappings.');
  }
}

main();
