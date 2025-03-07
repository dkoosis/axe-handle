#!/usr/bin/env node
/**
 * utils/check-directory-structure.js
 * 
 * Directory Structure Hygiene Check
 * 
 * This script verifies that the project structure matches the expected
 * organization and warns about any discrepancies.
 * 
 * The checks implemented here help maintain architectural consistency
 * by enforcing the documented project structure.
 */
const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // You may need to install this: npm install chalk

/**
 * Defines the expected directory structure for the project.
 * Each entry contains the type (dir/file) and optional children.
 */
const expectedStructure = {
  'docs': { type: 'dir' },
  'generatedServer': { type: 'dir', optional: true }, // Optional since it might not exist before first build
  'schemas': { type: 'dir' },
  'src': {
    type: 'dir',
    children: {
      'cli': { type: 'dir' },
      'mcpServerGenerator': { type: 'dir' },
      'parsers': {
        type: 'dir',
        children: {
          'modelContextProtocol': { type: 'dir' }
        }
      },
      'templateProcessor': { type: 'dir' },
      'types': { type: 'dir' },
      'utils': { type: 'dir' }
    }
  },
  'templates': { type: 'dir' },
  'tests': { type: 'dir' },
  'utils': { type: 'dir' },
  'README.md': { type: 'file' },
  'package.json': { type: 'file' }
};

/**
 * Defines items that should not exist in the project structure.
 * This helps enforce architectural decisions like using flat templates.
 */
const disallowedItems = {
  'templates': {
    dirs: ['express', 'common', 'mcp-server'] // No subdirectories in templates
  },
  'dist': { type: 'dir' } // dist should not exist (use generatedServer instead)
};

/**
 * Defines files that should exist in specific locations.
 * These are the core files that implement key project functionality.
 */
const requiredFiles = {
  'src/cli': ['index.ts'],
  'src/mcpServerGenerator': ['handlerGenerator.ts', 'serverGenerator.ts'],
  'src/parsers/modelContextProtocol': ['adapter.ts', 'cache.ts', 'index.ts', 'protocol.ts'], // spec.ts will replace protocol.json
  'src/templateProcessor': ['templateLoader.ts', 'templateProcessor.ts', 'templateRenderer.ts'],
  'src/types': ['index.ts'],
  'src/utils': ['errorUtils.ts', 'logger.ts']
};

/**
 * Defines suspicious patterns that indicate potential issues.
 * These are typically duplicate files or files that should be renamed.
 */
const suspiciousPatterns = {
  'duplicate adapter files': {
    path: 'src/parsers/modelContextProtocol',
    pattern: ['adapter.ts', 'protocolAdapter.ts']
  },
  'duplicate cache files': {
    path: 'src/parsers/modelContextProtocol',
    pattern: ['cache.ts', 'protocolCache.ts']
  },
  'protocol files not renamed': {
    path: 'src/parsers/modelContextProtocol',
    pattern: ['protocol.json'] // Should be renamed to spec.ts
  }
};

// Results storage
const issues = [];
const warnings = [];

/**
 * Checks if a path exists and is of the expected type.
 * 
 * @param {string} itemPath - The path to check
 * @param {string} expectedType - The expected type ('dir' or 'file')
 * @param {boolean} isOptional - Whether the item is optional
 * @returns {boolean} True if the item exists and matches the expected type
 */
function checkExists(itemPath, expectedType, isOptional = false) {
  try {
    const stats = fs.statSync(itemPath);
    const actualType = stats.isDirectory() ? 'dir' : 'file';
    
    if (actualType !== expectedType) {
      issues.push(`"${itemPath}" should be a ${expectedType}, but is a ${actualType}`);
      return false;
    }
    return true;
  } catch (err) {
    if (!isOptional) {
      issues.push(`"${itemPath}" is missing`);
    }
    return false;
  }
}

/**
 * Recursively checks the directory structure against the expected structure.
 * 
 * @param {string} basePath - The base path to check
 * @param {Object} structure - The expected structure definition
 * @param {string} currentPath - Current relative path (for reporting)
 */
function checkStructure(basePath, structure, currentPath = '') {
  for (const [name, details] of Object.entries(structure)) {
    const itemPath = path.join(basePath, name);
    const relativePath = path.join(currentPath, name);
    
    if (details.type) {
      const exists = checkExists(itemPath, details.type, details.optional);
      
      if (exists && details.type === 'dir' && details.children) {
        checkStructure(itemPath, details.children, relativePath);
      }
    }
  }
}

/**
 * Checks for disallowed items in the project structure.
 * This enforces architectural decisions like flat templates.
 */
function checkDisallowed() {
  // Check for specific disallowed items
  for (const [itemPath, details] of Object.entries(disallowedItems)) {
    if (details.type) {
      try {
        const stats = fs.statSync(itemPath);
        const actualType = stats.isDirectory() ? 'dir' : 'file';
        
        if (actualType === details.type) {
          issues.push(`"${itemPath}" should not exist (${details.type})`);
        }
      } catch (err) {
        // Item doesn't exist, which is good
      }
    } else if (details.dirs) {
      // Check for disallowed subdirectories
      try {
        const basePathExists = fs.existsSync(itemPath);
        if (basePathExists) {
          for (const disallowedDir of details.dirs) {
            const disallowedPath = path.join(itemPath, disallowedDir);
            if (fs.existsSync(disallowedPath)) {
              warnings.push(`Directory "${disallowedPath}" should be flattened (subdirectories not allowed in ${itemPath})`);
            }
          }
        }
      } catch (err) {
        console.error(`Error checking disallowed dirs in ${itemPath}:`, err);
      }
    }
  }
}

/**
 * Checks for required files in the project structure.
 * These are the core files that implement key project functionality.
 */
function checkRequiredFiles() {
  for (const [dirPath, files] of Object.entries(requiredFiles)) {
    try {
      if (fs.existsSync(dirPath)) {
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          if (!fs.existsSync(filePath)) {
            warnings.push(`Expected file "${filePath}" is missing`);
          }
        }
      }
    } catch (err) {
      console.error(`Error checking required files in ${dirPath}:`, err);
    }
  }
}

/**
 * Checks for suspicious patterns that indicate potential issues.
 * This helps identify duplicate files or files that need renaming.
 */
function checkSuspiciousPatterns() {
  for (const [name, check] of Object.entries(suspiciousPatterns)) {
    try {
      if (fs.existsSync(check.path)) {
        const matchCount = check.pattern.filter(file => 
          fs.existsSync(path.join(check.path, file))
        ).length;
        
        if (matchCount > 0) {
          warnings.push(`Found ${name} in ${check.path}: ${check.pattern.join(', ')}`);
        }
      }
    } catch (err) {
      console.error(`Error checking pattern "${name}":`, err);
    }
  }
}

/**
 * Checks for nested template files that should be at the root level.
 * Template files should be flat for consistency and ease of use.
 */
function checkTemplateNesting() {
  const templatesDir = 'templates';
  try {
    if (!fs.existsSync(templatesDir)) {
      return;
    }
    
    /**
     * Scans a directory recursively for template files.
     * 
     * @param {string} dir - The directory to scan
     * @param {number} depth - Current directory depth
     */
    function scanDirectory(dir, depth = 0) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath, depth + 1);
        } else if (depth > 0 && entry.name.endsWith('.eta')) {
          warnings.push(`Template file "${fullPath}" should be at the root level of templates/`);
        }
      }
    }
    
    scanDirectory(templatesDir);
  } catch (err) {
    console.error('Error checking template nesting:', err);
  }
}

/**
 * Main function to run all checks and report results.
 */
function runChecks() {
  console.log(chalk.blue('Checking project directory structure...'));
  
  try {
    checkStructure('.', expectedStructure);
    checkDisallowed();
    checkRequiredFiles();
    checkSuspiciousPatterns();
    checkTemplateNesting();
    
    // Report the results
    if (issues.length === 0 && warnings.length === 0) {
      console.log(chalk.green('✓ Directory structure looks good!'));
      return true;
    } else {
      if (issues.length > 0) {
        console.log(chalk.red(`✗ Found ${issues.length} issues that need to be fixed:`));
        issues.forEach(issue => console.log(chalk.red(`  - ${issue}`)));
        console.log('');
      }
      
      if (warnings.length > 0) {
        console.log(chalk.yellow(`⚠ Found ${warnings.length} warnings to consider:`));
        warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)));
        console.log('');
      }
      
      console.log(chalk.blue('See docs/TODO.md for the planned structure and outstanding tasks.'));
      
      // Exit with error code if there are issues
      return issues.length === 0;
    }
  } catch (err) {
    console.error(chalk.red('Error running directory structure checks:'), err);
    return false;
  }
}

// Run the checks and exit with appropriate code
if (!runChecks()) {
  process.exit(1);
}
