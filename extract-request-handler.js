// extract-request-handler.js
const fs = require('fs');
const path = require('path');

/**
 * Extracts the request-handler template from the request-handler-template.ts file
 */
function extractRequestHandlerTemplate() {
  console.log('Extracting request-handler template...');
  
  // Read the request handler template source file
  const templateSource = fs.readFileSync(path.join(__dirname, 'request-handler-template.ts'), 'utf8');
  
  // Create templates directory structure if it doesn't exist
  const templatesDir = path.join(__dirname, 'templates');
  const expressDir = path.join(templatesDir, 'express');
  const handlersDir = path.join(expressDir, 'src', 'handlers');
  
  if (!fs.existsSync(handlersDir)) {
    fs.mkdirSync(handlersDir, { recursive: true });
  }
  
  // Extract the template content (remove the first line that contains the file comment)
  const templateLines = templateSource.split('\n');
  const content = templateLines.slice(1).join('\n');
  
  // Write the template to the appropriate location
  const outputPath = path.join(handlersDir, 'request-handler.ts.ejs');
  fs.writeFileSync(outputPath, content);
  
  console.log(`Request handler template extracted to: ${outputPath}`);
}

// Run the function if this file is executed directly
if (require.main === module) {
  extractRequestHandlerTemplate();
}

module.exports = extractRequestHandlerTemplate;
