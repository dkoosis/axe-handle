// Path: src/generatorDebugger.ts
// Debug utility for the Axe Handle generator

import path from 'path';
import { generateMcpServer } from './index';
import { GeneratorOptions } from './types';

// Hardcoded paths for easier debugging
const schemaFile = path.resolve(__dirname, '../schemas/examples/calendar.proto');
const outputDir = path.resolve(__dirname, '../debug-output');

// Create generator options
const options: GeneratorOptions = {
  inputFile: schemaFile,
  outputDir: outputDir,
  overwrite: true,
  generateDocs: true,
  verbose: true
};

// Run the generator with verbose output
async function runGeneratorDebug() {
  try {
    console.log('Starting debug generation...');
    console.log(`Schema file: ${schemaFile}`);
    console.log(`Output directory: ${outputDir}`);
    
    await generateMcpServer(options);
    
    console.log('Generation completed successfully!');
  } catch (error) {
    console.error('Error during generation:');
    
    if (error instanceof Error) {
      console.error(`Name: ${error.name}`);
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      
      // Output additional properties for AxeError
      if ('code' in error) {
        console.error(`Code: ${(error as any).code}`);
      }
      if ('details' in error) {
        console.error(`Details: ${JSON.stringify((error as any).details, null, 2)}`);
      }
      if ('cause' in error && (error as any).cause) {
        console.error(`Cause: ${JSON.stringify((error as any).cause, null, 2)}`);
      }
    } else {
      console.error(`Unknown error type: ${JSON.stringify(error, null, 2)}`);
    }
  }
}

// Run the debug function
runGeneratorDebug();
