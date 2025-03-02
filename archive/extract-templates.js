// extract-templates.js
const fs = require('fs');
const path = require('path');

/**
 * Extracts embedded templates from express-templates.ts into separate .ejs files
 */
function extractTemplates() {
  console.log('Extracting EJS templates to files...');
  
  // Read the express-templates.ts file
  const templateSource = fs.readFileSync(path.join(__dirname, 'express-templates.ts'), 'utf8');
  
  // Create templates directory structure
  const templatesDir = path.join(__dirname, 'templates');
  const expressDir = path.join(templatesDir, 'express');
  const srcDir = path.join(expressDir, 'src');
  const handlersDir = path.join(srcDir, 'handlers');
  const modelsDir = path.join(srcDir, 'models');
  
  // Create directories if they don't exist
  [templatesDir, expressDir, srcDir, handlersDir, modelsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Parse the source file to extract templates
  // We'll look for EJS template content between specific markers
  const templateRegex = /\/\/ (.+\.ejs)\r?\n([\s\S]+?)(?=\r?\n\/\/ \w+\.ejs|\r?\n$)/g;
  
  let match;
  while ((match = templateRegex.exec(templateSource)) !== null) {
    const fileName = match[1];
    let content = match[2].trim();
    
    // Determine the appropriate subdirectory based on the file name
    let outputPath;
    if (fileName.startsWith('src/')) {
      // Handle nested path
      const parts = fileName.split('/');
      const targetDir = path.join(expressDir, parts.slice(0, -1).join('/'));
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      outputPath = path.join(expressDir, fileName);
    } else {
      outputPath = path.join(expressDir, fileName);
    }
    
    // Write the template to its file
    fs.writeFileSync(outputPath, content);
    console.log(`Extracted template: ${outputPath}`);
  }
  
  console.log('Template extraction complete!');
}

/**
 * Updates the ts-parser.js file to read templates from files instead of hardcoding them
 */
function updateTsParser() {
  console.log('Updating ts-parser.js to use template files...');
  
  // Read the current ts-parser.js file
  const parserPath = path.join(__dirname, 'ts-parser.js');
  let parserSource = fs.readFileSync(parserPath, 'utf8');
  
  // Replace the createExpressTemplates function with one that reads from files
  const newCreateExpressTemplates = `
// Create Express templates
function createExpressTemplates(expressDir) {
  console.log('Setting up Express templates directory...');
  
  // Ensure the directory structure exists
  if (!fs.existsSync(expressDir)) {
    fs.mkdirSync(expressDir, { recursive: true });
  }
  
  // Define templates to copy from the templates directory
  const templateFiles = [
    'package.json.ejs',
    'tsconfig.json.ejs',
    'gitignore.ejs',
    'README.md.ejs',
    'src/index.ts.ejs',
    'src/server.ts.ejs',
    'src/utils.ts.ejs',
    'src/capabilities.ts.ejs',
    'src/state-manager.ts.ejs',
    'src/handlers/connection-handler.ts.ejs',
    'src/handlers/message-handler.ts.ejs',
    'src/models/types.ts.ejs',
    'src/handlers/request-handler.ts.ejs',
    'resource-model.ts.ejs',
    'tool-handler.ts.ejs',
    'prompt-handler.ts.ejs'
  ];
  
  // Copy template files from our templates directory to the express templates directory
  const sourceTemplatesDir = path.join(__dirname, 'templates', 'express');
  
  templateFiles.forEach(templateFile => {
    const sourcePath = path.join(sourceTemplatesDir, templateFile);
    const targetPath = path.join(expressDir, templateFile);
    
    // Make sure the target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy the template file if it exists in our templates directory
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(\`Copied template: \${templateFile}\`);
    } else {
      console.warn(\`Warning: Template \${templateFile} not found in templates directory\`);
      
      // Create an empty template file to prevent errors
      fs.writeFileSync(targetPath, '// TODO: Implement this template');
      console.log(\`Created empty template: \${templateFile}\`);
    }
  });
  
  console.log('Express templates setup complete');
}`;

  // Find and replace the createExpressTemplates function
  const functionRegex = /function createExpressTemplates\(expressDir\) \{[\s\S]+?\}/;
  parserSource = parserSource.replace(functionRegex, newCreateExpressTemplates);
  
  // Update the NestJS and Fastify template creation functions similarly
  const newCreateNestTemplates = `
// Create NestJS templates
function createNestTemplates(nestDir) {
  console.log('Setting up NestJS templates directory...');
  
  if (!fs.existsSync(nestDir)) {
    fs.mkdirSync(nestDir, { recursive: true });
  }
  
  // Copy templates from our templates directory if they exist
  const sourceTemplatesDir = path.join(__dirname, 'templates', 'nest');
  
  if (fs.existsSync(sourceTemplatesDir)) {
    const templateFiles = fs.readdirSync(sourceTemplatesDir);
    
    templateFiles.forEach(file => {
      fs.copyFileSync(path.join(sourceTemplatesDir, file), path.join(nestDir, file));
    });
    
    console.log('NestJS templates copied successfully');
  } else {
    // Add placeholder
    fs.writeFileSync(path.join(nestDir, 'package.json.ejs'), '{ "name": "nest-placeholder" }');
    fs.writeFileSync(path.join(nestDir, 'tsconfig.json.ejs'), '{ "compilerOptions": {} }');
    fs.writeFileSync(path.join(nestDir, 'server.ts.ejs'), '// NestJS server template to be implemented');
    fs.writeFileSync(path.join(nestDir, 'types.ts.ejs'), '// NestJS types template to be implemented');
    fs.writeFileSync(path.join(nestDir, 'resource-model.ts.ejs'), '// NestJS resource model template to be implemented');
    fs.writeFileSync(path.join(nestDir, 'tool-handler.ts.ejs'), '// NestJS tool handler template to be implemented');
    fs.writeFileSync(path.join(nestDir, 'prompt-handler.ts.ejs'), '// NestJS prompt handler template to be implemented');
    fs.writeFileSync(path.join(nestDir, 'README.md.ejs'), '# NestJS MCP Server (Template to be implemented)');
    
    console.log('NestJS placeholder templates created');
  }
}`;

  const newCreateFastifyTemplates = `
// Create Fastify templates
function createFastifyTemplates(fastifyDir) {
  console.log('Setting up Fastify templates directory...');
  
  if (!fs.existsSync(fastifyDir)) {
    fs.mkdirSync(fastifyDir, { recursive: true });
  }
  
  // Copy templates from our templates directory if they exist
  const sourceTemplatesDir = path.join(__dirname, 'templates', 'fastify');
  
  if (fs.existsSync(sourceTemplatesDir)) {
    const templateFiles = fs.readdirSync(sourceTemplatesDir);
    
    templateFiles.forEach(file => {
      fs.copyFileSync(path.join(sourceTemplatesDir, file), path.join(fastifyDir, file));
    });
    
    console.log('Fastify templates copied successfully');
  } else {
    // Add placeholder
    fs.writeFileSync(path.join(fastifyDir, 'package.json.ejs'), '{ "name": "fastify-placeholder" }');
    fs.writeFileSync(path.join(fastifyDir, 'tsconfig.json.ejs'), '{ "compilerOptions": {} }');
    fs.writeFileSync(path.join(fastifyDir, 'server.ts.ejs'), '// Fastify server template to be implemented');
    fs.writeFileSync(path.join(fastifyDir, 'types.ts.ejs'), '// Fastify types template to be implemented');
    fs.writeFileSync(path.join(fastifyDir, 'resource-model.ts.ejs'), '// Fastify resource model template to be implemented');
    fs.writeFileSync(path.join(fastifyDir, 'tool-handler.ts.ejs'), '// Fastify tool handler template to be implemented');
    fs.writeFileSync(path.join(fastifyDir, 'prompt-handler.ts.ejs'), '// Fastify prompt handler template to be implemented');
    fs.writeFileSync(path.join(fastifyDir, 'README.md.ejs'), '# Fastify MCP Server (Template to be implemented)');
    
    console.log('Fastify placeholder templates created');
  }
}`;

  // Replace the functions
  parserSource = parserSource.replace(/function createNestTemplates\(nestDir\) \{[\s\S]+?\}/, newCreateNestTemplates);
  parserSource = parserSource.replace(/function createFastifyTemplates\(fastifyDir\) \{[\s\S]+?\}/, newCreateFastifyTemplates);
  
  // Write the updated parser back to disk
  fs.writeFileSync(parserPath, parserSource);
  
  console.log('ts-parser.js updated successfully!');
}

// Run the functions if this file is executed directly
if (require.main === module) {
  extractTemplates();
  updateTsParser();
}

module.exports = {
  extractTemplates,
  updateTsParser
};
