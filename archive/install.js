#!/usr/bin/env node
// install.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Make the setup scripts executable
const setupScriptsPath = path.join(__dirname, 'setup-templates.js');
fs.chmodSync(setupScriptsPath, '755');

// Run the update package.json script
require('./update-package-json')();

// Run the setup templates script
console.log('\nSetting up templates...');
require('./setup-templates')();

console.log('\nInstallation complete!');
console.log('You can now run: npm run setup-templates any time you need to regenerate the templates');
console.log('Or run: node ts-parser.js generate <schema-file> to generate an MCP server');
