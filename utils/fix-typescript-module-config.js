#!/usr/bin/env node
/**
 * Script to fix TypeScript module configuration for better compatibility
 */

const fs = require('fs');
const path = require('path');

// Config
const PROJECT_ROOT = path.resolve(__dirname);
const TSCONFIG_PATH = path.join(PROJECT_ROOT, 'tsconfig.json');

// Update tsconfig.json for better module compatibility
function updateTsConfig() {
  console.log('Updating tsconfig.json...');
  
  try {
    let tsConfig;
    
    try {
      tsConfig = JSON.parse(fs.readFileSync(TSCONFIG_PATH, 'utf-8'));
    } catch (err) {
      console.error('Error reading tsconfig.json:', err);
      return false;
    }
    
    // Update compiler options for better module compatibility
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }
    
    // Set module to CommonJS for better compatibility
    tsConfig.compilerOptions.module = "CommonJS";
    tsConfig.compilerOptions.moduleResolution = "Node";
    
    // Make sure esModuleInterop is enabled
    tsConfig.compilerOptions.esModuleInterop = true;
    tsConfig.compilerOptions.allowSyntheticDefaultImports = true;
    
    // Write back to file
    fs.writeFileSync(
      TSCONFIG_PATH,
      JSON.stringify(tsConfig, null, 2) + '\n'
    );
    
    console.log('Successfully updated tsconfig.json with CommonJS configuration');
    return true;
  } catch (error) {
    console.error('Error updating tsconfig.json:', error);
    return false;
  }
}

// Update package.json for CommonJS
function updatePackageJson() {
  const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
  console.log('Updating package.json module type...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    
    // Set type to commonjs or remove type field to default to commonjs
    if (packageJson.type === 'module') {
      delete packageJson.type; // Let it default to CommonJS
    }
    
    // Write back to file
    fs.writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    console.log('Successfully updated package.json for CommonJS compatibility');
    return true;
  } catch (error) {
    console.error('Error updating package.json:', error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting TypeScript module configuration fix...');
  
  const tsConfigUpdated = updateTsConfig();
  const packageJsonUpdated = updatePackageJson();
  
  if (tsConfigUpdated && packageJsonUpdated) {
    console.log('TypeScript module configuration successfully updated!');
  } else {
    console.log('Some updates to TypeScript module configuration failed. Check the logs above.');
  }
}

main();
