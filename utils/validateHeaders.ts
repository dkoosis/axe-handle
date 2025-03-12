#!/usr/bin/env node
/**
 * @file src/tools/validateHeaders.ts
 * @description CLI tool to validate and fix file headers
 * @author Axe Handle Team
 * @created 2025-03-10T00:00:00.000Z
 * @copyright Copyright (c) 2025 Axe Handle Project
 * @license ISC
 */

import path from 'path';
import { validateAllFileHeaders, ensureFileHeader } from '../utils/fileHeaders';

const args = process.argv.slice(2);
const fixOption = args.includes('--fix');
const verbose = args.includes('--verbose');
const dirArg = args.find(arg => !arg.startsWith('--'));
const rootDir = dirArg || './src';

async function main() {
  console.log(`Validating file headers in ${rootDir}...`);
  
  const result = await validateAllFileHeaders(rootDir);
  
  if (result.isErr()) {
    console.error(`Error validating headers: ${result.error.message}`);
    process.exit(1);
  }
  
  const { valid, invalid } = result.value;
  
  console.log(`\nResults:`);
  console.log(`- Valid headers: ${valid.length} files`);
  console.log(`- Invalid headers: ${invalid.length} files`);
  
  if (verbose && valid.length > 0) {
    console.log('\nFiles with valid headers:');
    valid.forEach(file => console.log(`  ✓ ${file}`));
  }
  
  if (invalid.length > 0) {
    console.log('\nFiles with invalid or missing headers:');
    invalid.forEach(file => console.log(`  ✗ ${file}`));
    
    if (fixOption) {
      console.log('\nFixing invalid headers...');
      
      for (const file of invalid) {
        const relativePath = path.relative(process.cwd(), file);
        
        try {
          const result = await ensureFileHeader(file, {
            description: `File in ${path.dirname(relativePath)}`,
            force: true
          });
          
          if (result.isOk()) {
            console.log(`  ✓ Fixed: ${relativePath}`);
          } else {
            console.error(`  ✗ Failed to fix: ${relativePath} - ${result.error.message}`);
          }
        } catch (error) {
          console.error(`  ✗ Error fixing ${relativePath}: ${error}`);
        }
      }
    } else {
      console.log('\nRun with --fix to automatically add or update headers.');
    }
    
    if (!fixOption) {
      process.exit(1);
    }
  }
  
  console.log('\nHeader validation complete.');
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});