#!/usr/bin/env node
// setup-templates.js
const { extractTemplates, updateTsParser } = require('./extract-templates');
const extractRequestHandlerTemplate = require('./extract-request-handler');

/**
 * Sets up the template directory structure and extracts all templates
 */
async function setupTemplates() {
  console.log('Setting up template directory structure...');
  
  try {
    // Extract main templates from express-templates.ts
    await extractTemplates();
    
    // Extract request handler template
    await extractRequestHandlerTemplate();
    
    // Update the parser to use the extracted templates
    await updateTsParser();
    
    console.log('\nTemplate setup complete! You can now run the generator with:');
    console.log('node ts-parser.js generate <your-schema-file>');
    
  } catch (error) {
    console.error('Error setting up templates:', error);
    process.exit(1);
  }
}

// Run the setup function if this file is executed directly
if (require.main === module) {
  setupTemplates();
}

module.exports = setupTemplates;
