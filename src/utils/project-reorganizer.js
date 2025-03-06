#!/usr/bin/env node
/**
 * Project structure reorganizer script
 * Consolidates directory structure to match intended organization
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Config
const PROJECT_ROOT = path.resolve(__dirname);

// Paths to check and fix
const PATHS = {
  // Incorrect location
  oldGeneratorDir: path.join(PROJECT_ROOT, 'src', 'generator'),
  
  // Correct locations
  newGeneratorsDir: path.join(PROJECT_ROOT, 'src', 'generators'),
  newCommonDir: path.join(PROJECT_ROOT, 'src', 'generators', 'common'),
  newExpressDir: path.join(PROJECT_ROOT, 'src', 'generators', 'express')
};

function checkDirectories() {
  console.log('Checking directory structure...');
  const dirStatus = {};
  
  // Check each path to see if it exists
  for (const [key, dirPath] of Object.entries(PATHS)) {
    dirStatus[key] = fs.existsSync(dirPath);
    console.log(`${key}: ${dirStatus[key] ? 'EXISTS' : 'MISSING'} (${dirPath})`);
  }
  
  return dirStatus;
}

function moveBaseGenerator() {
  console.log('\nMoving BaseGenerator to correct location...');
  
  const oldBaseGenPath = path.join(PATHS.oldGeneratorDir, 'generators', 'baseGenerator.ts');
  const newBaseGenPath = path.join(PATHS.newCommonDir, 'baseGenerator.ts');
  
  // Ensure destination directory exists
  if (!fs.existsSync(PATHS.newCommonDir)) {
    fs.mkdirSync(PATHS.newCommonDir, { recursive: true });
    console.log(`Created directory: ${PATHS.newCommonDir}`);
  }
  
  // Check if file exists at old location
  if (fs.existsSync(oldBaseGenPath)) {
    // Check if file already exists at new location
    if (fs.existsSync(newBaseGenPath)) {
      console.log(`File already exists at ${newBaseGenPath}`);
      console.log('Comparing files to ensure they are the same...');
      
      const oldContent = fs.readFileSync(oldBaseGenPath, 'utf-8');
      const newContent = fs.readFileSync(newBaseGenPath, 'utf-8');
      
      if (oldContent !== newContent) {
        console.log('Files differ. Backing up existing file and copying the one from old location...');
        fs.copyFileSync(newBaseGenPath, `${newBaseGenPath}.bak`);
        fs.copyFileSync(oldBaseGenPath, newBaseGenPath);
        console.log('File copied and backup created');
      } else {
        console.log('Files are identical');
      }
    } else {
      // Copy file to new location
      fs.copyFileSync(oldBaseGenPath, newBaseGenPath);
      console.log(`Copied ${oldBaseGenPath} to ${newBaseGenPath}`);
    }
  } else {
    console.log(`Source file not found: ${oldBaseGenPath}`);
    return false;
  }
  
  return true;
}

function moveGeneratorFiles() {
  console.log('\nMoving generator files to correct locations...');
  
  // Get list of all files in old generator directory
  const oldGeneratorsDir = path.join(PATHS.oldGeneratorDir, 'generators');
  
  if (!fs.existsSync(oldGeneratorsDir)) {
    console.log(`Old generators directory not found: ${oldGeneratorsDir}`);
    return false;
  }
  
  try {
    const files = fs.readdirSync(oldGeneratorsDir);
    let movedCount = 0;
    
    for (const file of files) {
      // Skip baseGenerator as we've already handled it
      if (file === 'baseGenerator.ts') continue;
      
      const oldPath = path.join(oldGeneratorsDir, file);
      
      // Skip directories for now
      if (fs.statSync(oldPath).isDirectory()) {
        console.log(`Skipping directory: ${file}`);
        continue;
      }
      
      // Determine destination based on file name
      let destDir;
      if (file.includes('Generator') || file === 'index.ts') {
        // Generic generators go to express directory
        destDir = PATHS.newExpressDir;
      } else {
        // Everything else goes to common
        destDir = PATHS.newCommonDir;
      }
      
      // Create destination directory if needed
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      const newPath = path.join(destDir, file);
      
      // Check if destination already exists
      if (fs.existsSync(newPath)) {
        console.log(`File already exists at ${newPath}`);
        
        const oldContent = fs.readFileSync(oldPath, 'utf-8');
        const newContent = fs.readFileSync(newPath, 'utf-8');
        
        if (oldContent !== newContent) {
          console.log(`Files differ: ${file}. Backing up existing file...`);
          fs.copyFileSync(newPath, `${newPath}.bak`);
          fs.copyFileSync(oldPath, newPath);
          console.log(`Copied ${file} and created backup`);
        } else {
          console.log(`Files are identical: ${file}`);
        }
      } else {
        // Copy file to new location
        fs.copyFileSync(oldPath, newPath);
        console.log(`Copied ${oldPath} to ${newPath}`);
      }
      
      movedCount++;
    }
    
    console.log(`Moved ${movedCount} files`);
    return movedCount > 0;
  } catch (error) {
    console.error('Error moving generator files:', error);
    return false;
  }
}

function fixExpressIndex() {
  console.log('\nFixing imports in express/index.ts...');
  
  const expressIndexPath = path.join(PATHS.newExpressDir, 'index.ts');
  
  if (!fs.existsSync(expressIndexPath)) {
    console.log(`Express index file not found: ${expressIndexPath}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(expressIndexPath, 'utf-8');
    
    // Replace the problematic import with a relative path
    const updatedContent = content.replace(
      /export\s*\*\s*from\s*['"]@generators\/express\/baseGenerator['"]\s*;?/g,
      "export * from '../common/baseGenerator';"
    );
    
    if (updatedContent !== content) {
      fs.writeFileSync(expressIndexPath, updatedContent);
      console.log('Fixed express index imports');
      return true;
    } else {
      console.log('No changes needed in express index');
      return false;
    }
  } catch (error) {
    console.error('Error fixing express index:', error);
    return false;
  }
}

function updateTsConfig() {
  console.log('\nUpdating tsconfig.json path mappings...');
  
  const tsConfigPath = path.join(PROJECT_ROOT, 'tsconfig.json');
  
  try {
    if (!fs.existsSync(tsConfigPath)) {
      console.log('tsconfig.json not found');
      return false;
    }
    
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
    
    // Ensure we have compilerOptions and paths
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }
    
    if (!tsConfig.compilerOptions.paths) {
      tsConfig.compilerOptions.paths = {};
    }
    
    // Update paths to match correct structure
    tsConfig.compilerOptions.paths = {
      "@axe/*": ["src/axe/*"],
      "@generators/*": ["src/generators/*"],
      "@generators/common/*": ["src/generators/common/*"],
      "@generators/express/*": ["src/generators/express/*"],
      "@utils/*": ["src/utils/*"],
      "@templates/*": ["templates/*"],
      "@parser/*": ["src/parser/*"]
    };
    
    // Write updated config
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2) + '\n');
    console.log('Updated tsconfig.json path mappings');
    
    return true;
  } catch (error) {
    console.error('Error updating tsconfig.json:', error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting project structure reorganization...');
  
  // Check current directory structure
  const dirStatus = checkDirectories();
  
  // Move BaseGenerator
  const baseGenMoved = moveBaseGenerator();
  
  // Move other generator files
  const filesMoved = moveGeneratorFiles();
  
  // Fix express index imports
  const indexFixed = fixExpressIndex();
  
  // Update tsconfig.json
  const tsConfigUpdated = updateTsConfig();
  
  console.log('\nSummary:');
  console.log(`- BaseGenerator moved: ${baseGenMoved ? 'YES' : 'NO'}`);
  console.log(`- Generator files moved: ${filesMoved ? 'YES' : 'NO'}`);
  console.log(`- Express index fixed: ${indexFixed ? 'YES' : 'NO'}`);
  console.log(`- tsconfig.json updated: ${tsConfigUpdated ? 'YES' : 'NO'}`);
  
  console.log('\nReorganization completed!');
  console.log('\nFor a comprehensive fix, consider running:');
  console.log('npm install');
  console.log('npm run build');
  console.log('npm run dev');
}

main();
