/**
 * This script validates that the project structure matches the expected organization
 * as described in the documentation.
 */
const fs = require('fs');
const path = require('path');

// Expected directory structure based on documentation
const expectedStructure = {
  'src': {
    'cli': {
      'index.ts': true  // Must exist
    },
    'mcpServerGenerator': {
      'handlerGenerator.ts': true,  // Must exist
      'serverGenerator.ts': true    // Must exist
    },
    'parsers': {
      'modelContextProtocol': {
        'index.ts': true,        // Must exist
        'adapter.ts': true,      // Must exist
        'cache.ts': true,        // Must exist
        'protocol.ts': true,     // Must exist
        'protocol.json': true    // Must exist
      }
    },
    'templateProcessor': {
      'templateProcessor.ts': true,  // Must exist
      'templateLoader.ts': true,     // Must exist
      'templateRenderer.ts': true    // Must exist
    },
    'types': {
      'index.ts': true  // Must exist
    },
    'utils': {
      'errorUtils.ts': true,  // Must exist
      'logger.ts': true       // Must exist
    }
  }
};

// Function to check if a directory exists
function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

// Function to validate the structure recursively
function validateStructure(basePath, structure, isRequired = true) {
  const results = {
    valid: true,
    missingRequiredElements: [],
    extraElements: []
  };

  // Skip validation if the base path doesn't exist and it's not required
  if (!directoryExists(basePath) && !isRequired) {
    return results;
  }

  // Check if the directory exists when it's required
  if (!directoryExists(basePath) && isRequired) {
    results.valid = false;
    results.missingRequiredElements.push(basePath);
    return results;
  }

  // Get all items in the directory
  const items = fs.readdirSync(basePath);
  
  // Check for required elements
  for (const [name, details] of Object.entries(structure)) {
    const itemPath = path.join(basePath, name);
    
    if (typeof details === 'object' && !Array.isArray(details)) {
      // This is a directory
      const dirResults = validateStructure(itemPath, details, details === true);
      if (!dirResults.valid) {
        results.valid = false;
        results.missingRequiredElements = [
          ...results.missingRequiredElements,
          ...dirResults.missingRequiredElements
        ];
      }
    } else if (details === true && !fileExists(itemPath)) {
      // This is a required file
      results.valid = false;
      results.missingRequiredElements.push(itemPath);
    }
  }

  return results;
}

// Main validation function
function validateProjectStructure() {
  console.log('Validating project structure...');
  
  const results = validateStructure('.', { 'src': expectedStructure.src });
  
  if (results.valid) {
    console.log('✅ Project structure is valid!');
    return true;
  } else {
    console.log('❌ Project structure has issues:');
    
    if (results.missingRequiredElements.length > 0) {
      console.log('\nMissing required elements:');
      results.missingRequiredElements.forEach(element => {
        console.log(`  - ${element}`);
      });
    }
    
    console.log('\nRecommendations:');
    console.log('1. Run the restructure script again');
    console.log('2. Manually create any missing files');
    console.log('3. Check for typos in filenames');
    
    return false;
  }
}

// Run the validation
validateProjectStructure();
