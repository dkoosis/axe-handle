// index.js - Main module exports for Axe Handle

const MCPServerGenerator = require('./generator');
const TemplateEngine = require('./template-engine');
const { parseMCPSchema, generateMarkdown } = require('./ts-parser');

/**
 * Axe Handle - MCP Server Generator
 * 
 * This module exports the core functionality of the Axe Handle generator,
 * allowing programmatic usage of the generator in addition to the CLI.
 */
module.exports = {
  // Core generator class
  MCPServerGenerator,
  
  // Template engine for code generation
  TemplateEngine,
  
  // Schema parser utilities
  schema: {
    parse: parseMCPSchema,
    generateDocs: generateMarkdown
  },
  
  // Convenience method to generate code from a schema
  generate: async (options) => {
    const generator = new MCPServerGenerator(options);
    return generator.generate();
  }
};
