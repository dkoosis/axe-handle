#!/usr/bin/env node
// Path: src/utils/fix-generator-paths.js
 * Script to fix generator path mappings in tsconfig.json
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
    // Preserving existing paths and adding more specific mappings
    const existingPaths = tsConfig.compilerOptions.paths || {};
    
    tsConfig.compilerOptions.paths = {
      ...existingPaths,
      "@generators/express/baseGenerator": ["src/generators/common/baseGenerator.ts"],
      "@generators/express/*": ["src/generators/express/*"],
      "@generators/common/*": ["src/generators/common/*"]
    };
    
    // Write updated config
    fs.writeFileSync(TSCONFIG_PATH, JSON.stringify(tsConfig, null, 2) + '\n');
    console.log('Successfully updated generator path mappings in tsconfig.json');
    
    return true;
  } catch (error) {
    console.error('Error updating tsconfig.json:', error);
    return false;
  }
}

function fixCircularImports() {
  console.log('Checking for circular imports in generator files...');
  
  const generatorIndexPath = path.join(PROJECT_ROOT, 'src', 'generators', 'express', 'index.ts');
  
  try {
    if (!fs.existsSync(generatorIndexPath)) {
      console.log(`Generator index file not found: ${generatorIndexPath}`);
      return false;
    }
    
    const content = fs.readFileSync(generatorIndexPath, 'utf-8');
    let updated = false;
    
    // Fix problematic imports
    let updatedContent = content.replace(
      /export\s*\*\s*from\s*['"]@generators\/express\/baseGenerator['"]\s*;?/g,
      "export * from '../common/baseGenerator';"
    );
    
    if (updatedContent !== content) {
      fs.writeFileSync(generatorIndexPath, updatedContent);
      console.log(`Updated import in ${generatorIndexPath}`);
      updated = true;
    }
    
    return updated;
  } catch (error) {
    console.error('Error fixing circular imports:', error);
    return false;
  }
}

function checkFileStructure() {
  console.log('Checking file structure...');
  
  // Check if the baseGenerator.ts file exists in the common directory
  const basePath = path.join(PROJECT_ROOT, 'src', 'generators', 'common', 'baseGenerator.ts');
  const expressBasePath = path.join(PROJECT_ROOT, 'src', 'generators', 'express', 'baseGenerator.ts');
  
  if (!fs.existsSync(basePath) && fs.existsSync(expressBasePath)) {
    // If it doesn't exist in common but exists in express, we should copy it
    console.log('Moving baseGenerator.ts from express to common directory...');
    
    // Create common directory if it doesn't exist
    const commonDir = path.join(PROJECT_ROOT, 'src', 'generators', 'common');
    if (!fs.existsSync(commonDir)) {
      fs.mkdirSync(commonDir, { recursive: true });
    }
    
    // Copy the file
    const content = fs.readFileSync(expressBasePath, 'utf-8');
    fs.writeFileSync(basePath, content);
    console.log('Successfully copied baseGenerator.ts to common directory');
    
    return true;
  }
  
  if (fs.existsSync(basePath)) {
    console.log('baseGenerator.ts already exists in common directory');
    return true;
  }
  
  console.log('Warning: baseGenerator.ts not found in either location');
  return false;
}

// Main function
function main() {
  console.log('Starting generator path mappings fix...');
  
  // First check the file structure
  const fileStructureChecked = checkFileStructure();
  
  // Then fix any circular imports
  const importsFixed = fixCircularImports();
  
  // Finally update the tsconfig paths
  const tsConfigUpdated = updateTsConfigPaths();
  
  console.log('\nFix completed!');
  console.log('Try running "npm run dev" again.');
  
  if (!fileStructureChecked) {
    console.log('\nWARNING: Could not locate baseGenerator.ts file.');
    console.log('You may need to manually check where this file is located in your project structure.');
  }
}

main();
