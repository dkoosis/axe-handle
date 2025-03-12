#!/usr/bin/env node
// Path: utils/validate-path-headers.js
// Validates that source files have proper path headers

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// Configuration
const PROJECT_ROOT = process.cwd();
const FIX_MODE = process.argv.includes('--fix');
const SINGLE_FILE = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];
const FILE_PATTERNS = ['src/**/*.ts', 'src/**/*.js', 'utils/**/*.js'];
const IGNORE_PATTERNS = ['**/node_modules/**', '**/dist/**', '**/coverage/**'];

/**
 * Get comment prefix based on file extension
 */
function getCommentPrefix(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.js':
    case '.ts':
    case '.jsx':
    case '.tsx':
      return '//';
    case '.py':
      return '#';
    case '.sh':
      return '#';
    default:
      return '//';
  }
}

/**
 * Check if file has correct path header
 */
function checkPathHeader(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lines.length === 0) {
    return { valid: false, reason: 'File is empty' };
  }
  
  // Check for shebang line
  let lineIndex = 0;
  if (lines[0].startsWith('#!')) {
    lineIndex = 1;
  }
  
  // Skip empty lines
  while (lineIndex < lines.length && lines[lineIndex].trim() === '') {
    lineIndex++;
  }
  
  if (lineIndex >= lines.length) {
    return { valid: false, reason: 'File has no content' };
  }
  
  const commentPrefix = getCommentPrefix(filePath);
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const expectedHeader = `${commentPrefix} Path: ${relativePath}`;
  const currentLine = lines[lineIndex].trim();
  
  if (!currentLine.startsWith(`${commentPrefix} Path:`)) {
    return { 
      valid: false, 
      reason: 'Missing path header',
      expectedHeader,
      lineIndex
    };
  }
  
  if (currentLine !== expectedHeader) {
    return {
      valid: false,
      reason: `Incorrect path header: "${currentLine}" should be "${expectedHeader}"`,
      expectedHeader,
      lineIndex
    };
  }
  
  return { valid: true };
}

/**
 * Fix path header in file
 */
function fixPathHeader(filePath, result) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (result.lineIndex !== undefined) {
    // Replace existing header
    if (result.lineIndex < lines.length) {
      lines[result.lineIndex] = result.expectedHeader;
    }
  } else {
    // Add header after shebang if exists
    let insertPosition = 0;
    if (lines.length > 0 && lines[0].startsWith('#!')) {
      insertPosition = 1;
    }
    lines.splice(insertPosition, 0, result.expectedHeader);
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  return true;
}

/**
 * Check a single file
 */
function checkSingleFile(filePath) {
  console.log(chalk.cyan(`Checking path header in: ${filePath}`));
  
  const fullPath = path.resolve(PROJECT_ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(chalk.red(`File not found: ${filePath}`));
    return false;
  }
  
  const result = checkPathHeader(fullPath);
  
  if (result.valid) {
    console.log(chalk.green(`Valid header in: ${filePath}`));
    return true;
  } else {
    if (FIX_MODE && result.expectedHeader) {
      if (fixPathHeader(fullPath, result)) {
        console.log(chalk.green(`Fixed header in: ${filePath}`));
        return true;
      } else {
        console.log(chalk.red(`Failed to fix header in: ${filePath}`));
        return false;
      }
    } else {
      console.log(chalk.red(`Invalid header in: ${filePath}: ${result.reason}`));
      return false;
    }
  }
}

// Main function
function main() {
  // If checking a single file
  if (SINGLE_FILE) {
    return checkSingleFile(SINGLE_FILE);
  }
  
  console.log(chalk.cyan('Validating path headers in source files...'));
  
  // Find all files
  let files = [];
  for (const pattern of FILE_PATTERNS) {
    const matches = glob.sync(pattern, { 
      cwd: PROJECT_ROOT,
      ignore: IGNORE_PATTERNS
    });
    files = files.concat(matches);
  }
  
  // Remove duplicates
  files = [...new Set(files)];
  
  let validCount = 0;
  let fixedCount = 0;
  const invalid = [];
  
  // Check each file
  for (const file of files) {
    const filePath = path.join(PROJECT_ROOT, file);
    const result = checkPathHeader(filePath);
    
    if (result.valid) {
      validCount++;
    } else {
      if (FIX_MODE && result.expectedHeader) {
        if (fixPathHeader(filePath, result)) {
          console.log(chalk.green(`Fixed: ${file}`));
          fixedCount++;
        } else {
          invalid.push({ file, reason: result.reason });
        }
      } else {
        invalid.push({ file, reason: result.reason });
      }
    }
  }
  
  // Print summary
  console.log('\nPath Header Validation Summary:');
  console.log(`  Total files checked: ${files.length}`);
  console.log(`  Valid headers: ${validCount}`);
  
  if (FIX_MODE) {
    console.log(`  Fixed headers: ${fixedCount}`);
    console.log(`  Remaining invalid: ${invalid.length}`);
  } else {
    console.log(`  Invalid headers: ${invalid.length}`);
  }
  
  // Print invalid files
  if (invalid.length > 0) {
    console.log(chalk.yellow('\nFiles with invalid headers:'));
    
    for (const { file, reason } of invalid) {
      console.log(`  ${chalk.red('✗')} ${file}: ${reason}`);
    }
    
    if (!FIX_MODE) {
      console.log(chalk.yellow('\nRun with --fix to automatically fix headers'));
    }
    
    // Exit with error code if any invalid files
    process.exit(1);
  }
}

// Run the main function
const result = main();
if (SINGLE_FILE && result === false) {
  process.exit(1);
}
