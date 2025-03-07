// Path: src/utils/validate-structure.js
const fs = require('fs');
const path = require('path');

const EXPECTED_STRUCTURE = {
  'src': {
    'generators': {
      'common': ['baseGenerator.ts'],
      'express': ['index.ts', 'typesGenerator.ts', 'handlerGenerator.ts', 'serverGenerator.ts', 
                 'indexGenerator.ts', 'projectFilesGenerator.ts', 'documentationGenerator.ts']
    },
    'parser': {
      'protocol': ['index.ts', 'adapter.ts', 'cache.ts'],
      'serviceParser.ts': null
    },
    'mcp': {
      'mapper.ts': null
    },
    'utils': {
      'templates': ['templateError.ts', 'templateLoader.ts', 'templateRenderer.ts', 
                   'templateResolver.ts', 'templateTypes.ts'],
      'logger.ts': null,
      'errorUtils.ts': null,
      'resultUtils.ts': null,
      'templateSystem.ts': null,
      'performanceUtils.ts': null,
      'validationUtils.ts': null
    },
    'types.ts': null,
    'cli.ts': null,
    'index.ts': null
  }
};

let hasErrors = false;

function validateStructure(expectedStructure, currentPath = '.') {
  for (const [name, expected] of Object.entries(expectedStructure)) {
    const itemPath = path.join(currentPath, name);
    
    if (!fs.existsSync(itemPath)) {
      console.error(`❌ Missing: ${itemPath}`);
      hasErrors = true;
      continue;
    }

    if (expected === null) {
      // It's a file, we already confirmed it exists
      continue;
    }
    
    if (Array.isArray(expected)) {
      // It's a directory with expected files
      if (!fs.statSync(itemPath).isDirectory()) {
        console.error(`❌ Expected directory: ${itemPath}`);
        hasErrors = true;
        continue;
      }
      
      for (const file of expected) {
        const filePath = path.join(itemPath, file);
        if (!fs.existsSync(filePath)) {
          console.error(`❌ Missing file: ${filePath}`);
          hasErrors = true;
        }
      }
    } else {
      // It's a directory with structure
      if (!fs.statSync(itemPath).isDirectory()) {
        console.error(`❌ Expected directory: ${itemPath}`);
        hasErrors = true;
        continue;
      }
      
      validateStructure(expected, itemPath);
    }
  }
}

// Run the validation
validateStructure(EXPECTED_STRUCTURE);

if (!hasErrors) {
  console.log('✅ Directory structure is valid!');
  process.exit(0);
} else {
  console.error('❌ Directory structure validation failed!');
  process.exit(1);
}