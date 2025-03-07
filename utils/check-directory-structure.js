#!/usr/bin/env node
// Path: utils/check-directory-structure.js
// Pre-build check for directory structure changes

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chalk = require('chalk');

// Configuration
const PROJECT_ROOT = process.cwd();
const STRUCTURE_SNAPSHOT_FILE = path.join(PROJECT_ROOT, '.directory-structure.json');
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'generated',
  '**/*.log',
  'coverage'
];

/**
 * Get directory structure as a tree
 */
function getDirectoryStructure(dir, relativePath = '') {
  const structure = {
    path: relativePath || '/',
    type: 'directory',
    children: []
  };

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    const entryRelativePath = path.join(relativePath, entry.name);
    
    // Skip ignored patterns
    if (IGNORE_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        return entryRelativePath.includes(pattern.replace('*', ''));
      }
      return entryRelativePath.includes(pattern);
    })) {
      continue;
    }

    if (entry.isDirectory()) {
      structure.children.push(getDirectoryStructure(entryPath, entryRelativePath));
    } else {
      // For files, we only need the path and type
      structure.children.push({
        path: entryRelativePath,
        type: 'file'
      });
    }
  }

  // Sort children for deterministic comparison
  structure.children.sort((a, b) => a.path.localeCompare(b.path));
  return structure;
}

/**
 * Save structure snapshot
 */
function saveStructureSnapshot(structure) {
  fs.writeFileSync(STRUCTURE_SNAPSHOT_FILE, JSON.stringify(structure, null, 2));
  console.log(chalk.green('Directory structure snapshot saved'));
}

/**
 * Compare current structure with snapshot
 */
function compareWithSnapshot(currentStructure) {
  if (!fs.existsSync(STRUCTURE_SNAPSHOT_FILE)) {
    console.log(chalk.yellow('No previous directory structure snapshot found. Creating one...'));
    saveStructureSnapshot(currentStructure);
    return { changed: false, differences: [] };
  }

  const snapshot = JSON.parse(fs.readFileSync(STRUCTURE_SNAPSHOT_FILE, 'utf-8'));
  return compareStructures(snapshot, currentStructure);
}

/**
 * Compare two directory structures
 */
function compareStructures(snapshot, current) {
  const changes = {
    changed: false,
    differences: []
  };

  // Compare snapshot structure to current
  findDifferences(snapshot, current, changes.differences, 'snapshot');
  
  // Compare current structure to snapshot to find additions
  findDifferences(current, snapshot, changes.differences, 'current');
  
  changes.changed = changes.differences.length > 0;
  return changes;
}

/**
 * Find differences between two structures
 */
function findDifferences(structureA, structureB, differences, source) {
  const mapB = new Map();
  structureB.children.forEach(child => {
    mapB.set(child.path, child);
  });

  for (const itemA of structureA.children) {
    const itemB = mapB.get(itemA.path);
    
    // Item missing from B
    if (!itemB) {
      differences.push({
        path: itemA.path,
        type: itemA.type,
        change: source === 'snapshot' ? 'removed' : 'added'
      });
      continue;
    }
    
    // Types don't match (file vs directory)
    if (itemA.type !== itemB.type) {
      differences.push({
        path: itemA.path,
        type: `changed from ${itemA.type} to ${itemB.type}`,
        change: 'modified'
      });
      continue;
    }
    
    // Recursively check directories
    if (itemA.type === 'directory' && itemA.children) {
      findDifferences(itemA, itemB, differences, source);
    }
  }
}

/**
 * Print differences in a readable format
 */
function printDifferences(differences) {
  if (differences.length === 0) {
    return;
  }

  console.log(chalk.yellow('\nDirectory structure has changed:'));
  
  // Group by change type for better readability
  const added = differences.filter(d => d.change === 'added');
  const removed = differences.filter(d => d.change === 'removed');
  const modified = differences.filter(d => d.change === 'modified');
  
  if (added.length > 0) {
    console.log(chalk.green('\nAdded:'));
    added.forEach(item => {
      console.log(`  ${chalk.green('+')} ${item.path} (${item.type})`);
    });
  }
  
  if (removed.length > 0) {
    console.log(chalk.red('\nRemoved:'));
    removed.forEach(item => {
      console.log(`  ${chalk.red('-')} ${item.path} (${item.type})`);
    });
  }
  
  if (modified.length > 0) {
    console.log(chalk.blue('\nModified:'));
    modified.forEach(item => {
      console.log(`  ${chalk.blue('~')} ${item.path} (${item.type})`);
    });
  }
}

/**
 * Hash the structure for quick comparison
 */
function hashStructure(structure) {
  return crypto
    .createHash('md5')
    .update(JSON.stringify(structure))
    .digest('hex');
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const forceUpdate = args.includes('--update');
  const checkOnly = args.includes('--check');
  
  console.log(chalk.cyan('Checking directory structure...'));
  
  try {
    const currentStructure = getDirectoryStructure(PROJECT_ROOT);
    const currentHash = hashStructure(currentStructure);
    
    if (forceUpdate) {
      saveStructureSnapshot(currentStructure);
      return;
    }
    
    const { changed, differences } = compareWithSnapshot(currentStructure);
    
    if (changed) {
      printDifferences(differences);
      
      if (!checkOnly) {
        console.log(chalk.yellow('\nDirectory structure has changed. Update the snapshot?'));
        console.log('Run with --update to update the snapshot.');
        process.exit(1);
      }
    } else {
      console.log(chalk.green('Directory structure unchanged'));
    }
  } catch (error) {
    console.error(chalk.red('Error checking directory structure:'), error);
    process.exit(1);
  }
}

main();
