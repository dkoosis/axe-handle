#!/usr/bin/env node
/**
 * Script to fix chalk imports across the codebase and update package.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Config
const PROJECT_ROOT = path.resolve(__dirname);
const FILE_EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx'];
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

// Find all TypeScript/JavaScript files in the project
function findSourceFiles() {
  const patterns = FILE_EXTENSIONS.map(ext => `**/*${ext}`);
  const ignorePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**'];
  
  console.log('Finding source files...');
  
  let allFiles = [];
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { 
      cwd: PROJECT_ROOT, 
      ignore: ignorePatterns,
      absolute: true 
    });
    allFiles = allFiles.concat(files);
  });
  
  console.log(`Found ${allFiles.length} source files`);
  return allFiles;
}

// Fix chalk imports in a file
function fixChalkImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = false;
  
  // Replace various chalk import patterns
  const patterns = [
    { regex: /import\s+chalk\s+from\s+['"]chalk['"];?/g, replacement: "const chalk = require('chalk');" },
    { regex: /import\s+\*\s+as\s+chalk\s+from\s+['"]chalk['"];?/g, replacement: "const chalk = require('chalk');" },
    { regex: /import\s+{\s*[\w\s,]+\s*}\s+from\s+['"]chalk['"];?/g, replacement: "const chalk = require('chalk');" },
    { regex: /import\s+['"]chalk['"];?/g, replacement: "const chalk = require('chalk');" },
  ];
  
  let updatedContent = content;
  for (const pattern of patterns) {
    if (pattern.regex.test(updatedContent)) {
      updatedContent = updatedContent.replace(pattern.regex, pattern.replacement);
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated: ${path.relative(PROJECT_ROOT, filePath)}`);
  }
  
  return updated;
}

// Update package.json to use chalk v4
function updatePackageJson() {
  console.log('Updating package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    
    // Update dependencies
    if (packageJson.dependencies && packageJson.dependencies.chalk) {
      packageJson.dependencies.chalk = "^4.1.2";
    }
    
    // Update devDependencies if present
    if (packageJson.devDependencies && packageJson.devDependencies.chalk) {
      packageJson.devDependencies.chalk = "^4.1.2";
    }
    
    // Write back to file
    fs.writeFileSync(
      PACKAGE_JSON_PATH,
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    
    console.log('Successfully updated package.json with chalk v4.1.2');
    return true;
  } catch (error) {
    console.error('Error updating package.json:', error);
    return false;
  }
}

// Reinstall dependencies
function reinstallDependencies() {
  console.log('Reinstalling dependencies...');
  try {
    // Use npm or yarn based on what's available
    if (fs.existsSync(path.join(PROJECT_ROOT, 'yarn.lock'))) {
      execSync('yarn', { stdio: 'inherit', cwd: PROJECT_ROOT });
    } else {
      execSync('npm install', { stdio: 'inherit', cwd: PROJECT_ROOT });
    }
    console.log('Dependencies reinstalled successfully');
    return true;
  } catch (error) {
    console.error('Error reinstalling dependencies:', error);
    return false;
  }
}

// Main function
function main() {
  console.log('Starting chalk import fix...');
  
  // First update package.json
  const packageJsonUpdated = updatePackageJson();
  
  // Find and update source files
  const sourceFiles = findSourceFiles();
  let updatedFiles = 0;
  
  for (const file of sourceFiles) {
    try {
      const updated = fixChalkImportsInFile(file);
      if (updated) {
        updatedFiles++;
      }
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  
  console.log(`Updated ${updatedFiles} files with fixed chalk imports`);
  
  // Reinstall dependencies if package.json was updated
  if (packageJsonUpdated) {
    reinstallDependencies();
  }
  
  console.log('Chalk import fix completed!');
}

main();
