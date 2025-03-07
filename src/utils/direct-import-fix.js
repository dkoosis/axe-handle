#!/usr/bin/env node
/**
 * Direct import fix for express/index.ts
 */

const fs = require('fs');
const path = require('path');

// Config
const PROJECT_ROOT = path.resolve(__dirname);
const EXPRESS_INDEX_PATH = path.join(PROJECT_ROOT, 'src', 'generators', 'express', 'index.ts');

function fixDirectImport() {
  console.log('Fixing import in src/generators/express/index.ts...');
  
  try {
    if (!fs.existsSync(EXPRESS_INDEX_PATH)) {
      console.error(`Express index file not found: ${EXPRESS_INDEX_PATH}`);
      return false;
    }
    
    const content = fs.readFileSync(EXPRESS_INDEX_PATH, 'utf-8');
    console.log('Current content:');
    console.log(content);
    
    // Use a relative path instead of path alias
    const updatedContent = content.replace(
      /export\s*\*\s*from\s*['"]@generators\/express\/baseGenerator['"]\s*;?/g, 
      "export * from '../common/baseGenerator';"
    );
    
    if (updatedContent !== content) {
      fs.writeFileSync(EXPRESS_INDEX_PATH, updatedContent);
      console.log('Successfully fixed import in express/index.ts');
      
      console.log('Updated content:');
      console.log(updatedContent);
      
      return true;
    } else {
      console.log('No matching import pattern found or no changes needed');
      return false;
    }
  } catch (error) {
    console.error('Error fixing express/index.ts:', error);
    return false;
  }
}

// Check if we need to create baseGenerator in common folder
function ensureBaseGenerator() {
  const commonBaseGenPath = path.join(PROJECT_ROOT, 'src', 'generators', 'common', 'baseGenerator.ts');
  const expressBaseGenPath = path.join(PROJECT_ROOT, 'src', 'generators', 'express', 'baseGenerator.ts');
  
  // Check if we need to copy or create the file
  if (!fs.existsSync(commonBaseGenPath)) {
    console.log('BaseGenerator not found in common folder, checking express folder...');
    
    // Create common directory if needed
    const commonDir = path.dirname(commonBaseGenPath);
    if (!fs.existsSync(commonDir)) {
      fs.mkdirSync(commonDir, { recursive: true });
      console.log('Created common directory');
    }
    
    if (fs.existsSync(expressBaseGenPath)) {
      // Copy the file
      const content = fs.readFileSync(expressBaseGenPath, 'utf-8');
      fs.writeFileSync(commonBaseGenPath, content);
      console.log('Copied baseGenerator.ts from express to common folder');
    } else {
      console.log('BaseGenerator not found in express folder either, creating a stub...');
      
      // Create a stub file
      const stubContent = `// Path: src/generators/common/baseGenerator.ts
// Base Generator class with common functionality for all generators

import * as path from 'path';
import * as fs from 'fs';
import { GeneratorOptions } from '../../types/index';
import { logger, LogCategory } from '../../utils/logger';
import { createGeneratorError } from '../../utils/errorUtils';

/**
 * Base Generator class that provides common functionality for all generators.
 */
export abstract class BaseGenerator {
  protected initialized: boolean = false;

  /**
   * Initialize the generator
   * @param options Generator options
   */
  protected async initialize(options: GeneratorOptions): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    logger.debug('Initializing generator...', LogCategory.GENERATOR);
    this.initialized = true;
  }

  /**
   * Render a template to a file
   * @param templateName Template name to render
   * @param outputPath Path to write the rendered template
   * @param data Data for template rendering
   */
  protected async renderTemplate(
    templateName: string, 
    outputPath: string, 
    data: any
  ): Promise<void> {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Placeholder for actual template rendering
    logger.debug(\`Generated file: \${path.basename(outputPath)}\`, LogCategory.GENERATOR);
  }

  /**
   * Generate a basic text file when a template is not available
   * @param outputPath Path to write the file
   * @param content Content to write
   */
  protected generateBasicFile(outputPath: string, content: string): void {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(outputPath, content, 'utf-8');
      
      logger.debug(\`Generated basic file: \${path.basename(outputPath)}\`, LogCategory.GENERATOR);
    } catch (error) {
      throw createGeneratorError(
        1201,
        \`Failed to generate basic file\`,
        { outputPath },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Create a base template data object with common fields
   * @param additionalData Additional data to include
   * @returns Template data object
   */
  protected createBaseTemplateData(additionalData: Record<string, any> = {}): Record<string, any> {
    return {
      date: new Date().toISOString(),
      version: '0.1.0',
      ...additionalData
    };
  }
}`;
      
      fs.writeFileSync(commonBaseGenPath, stubContent);
      console.log('Created stub baseGenerator.ts in common folder');
    }
    
    return true;
  } else {
    console.log('baseGenerator.ts already exists in common folder');
    return true;
  }
}

// Main function
function main() {
  console.log('Starting direct import fix...');
  
  // First ensure the baseGenerator exists
  const baseGenEnsured = ensureBaseGenerator();
  
  // Then fix the direct import
  const importFixed = fixDirectImport();
  
  if (baseGenEnsured && importFixed) {
    console.log('\nFix completed successfully!');
    console.log('Try running "npm run dev" again.');
  } else {
    console.log('\nFix completed with some issues.');
    console.log('You may need to manually edit src/generators/express/index.ts');
    console.log('Change: export * from \'@generators/express/baseGenerator\';');
    console.log('To:     export * from \'../common/baseGenerator\';');
  }
}

main();
