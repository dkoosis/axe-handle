// code-generator.js - Main code generator for MCP servers
const path = require('path');
const fs = require('fs');
const { parseMCPSchema } = require('./ts-parser');
const TemplateEngine = require('./template-engine');

/**
 * MCP Server Code Generator
 * Coordinates the generation of MCP server code from schema definition
 */
class MCPServerGenerator {
  /**
   * Create a new MCP Server Generator
   * @param {Object} options - Generator options
   * @param {string} options.schemaPath - Path to MCP schema file
   * @param {string} options.outputDir - Output directory for generated code
   * @param {string} options.templateDir - Directory containing templates
   * @param {string} options.framework - Server framework to use (express, nestjs, fastify)
   * @param {Object} options.config - Additional configuration options
   */
  constructor(options) {
    this.schemaPath = options.schemaPath;
    this.outputDir = options.outputDir;
    this.templateDir = options.templateDir || path.join(__dirname, 'templates');
    this.framework = options.framework || 'express';
    this.config = options.config || {};
    
    // Initialize template engine
    this.templateEngine = new TemplateEngine(
      path.join(this.templateDir, this.framework)
    );
    
    // Default configuration
    this.config = {
      projectName: 'mcp-server',
      author: process.env.USER || 'MCP Generator User',
      version: '1.0.0',
      description: 'MCP Protocol Server',
      license: 'MIT',
      ...this.config
    };
  }

  /**
   * Initialize the generator
   */
  initialize() {
    console.log('Initializing MCP Server Generator...');
    
    // Load templates
    this.templateEngine.loadTemplates();
    
    // Register custom helpers specific to MCP generation
    this.templateEngine.registerHelper('isRequestType', (type) => {
      return type.endsWith('Request');
    });
    
    this.templateEngine.registerHelper('isResponseType', (type) => {
      return type.endsWith('Result') || type.endsWith('Response');
    });
    
    this.templateEngine.registerHelper('getResponseTypeForRequest', (requestType) => {
      return requestType.replace('Request', 'Result');
    });
    
    this.templateEngine.registerHelper('getMethodFromRequest', (requestType) => {
      const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
      return methodParts.map(p => p.toLowerCase()).join('_');
    });
  }

  /**
   * Parse the MCP schema
   * @returns {Object} Parsed schema
   */
  parseSchema() {
    console.log(`Parsing schema from ${this.schemaPath}...`);
    return parseMCPSchema(this.schemaPath);
  }

  /**
   * Prepare generation context from the schema
   * @param {Object} schema - Parsed MCP schema
   * @returns {Object} Generation context
   */
  prepareContext(schema) {
    // Extract key elements from schema for template rendering
    const requests = Object.values(schema.interfaces)
      .filter(iface => iface.name.endsWith('Request'))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const responses = Object.values(schema.interfaces)
      .filter(iface => iface.name.endsWith('Result') || iface.name.endsWith('Response'))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    const notifications = Object.values(schema.interfaces)
      .filter(iface => iface.name.endsWith('Notification'))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Group requests by category (based on common prefix)
    const requestCategories = {};
    for (const request of requests) {
      const category = request.name.replace('Request', '').replace(/[A-Z][a-z]+$/, '');
      if (!requestCategories[category]) {
        requestCategories[category] = [];
      }
      requestCategories[category].push(request);
    }
    
    return {
      schema,
      config: this.config,
      timestamp: new Date().toISOString(),
      requests,
      responses,
      notifications,
      requestCategories,
      protocolVersion: schema.version,
      framework: this.framework
    };
  }

  /**
   * Generate server code
   */
  async generate() {
    try {
      this.initialize();
      
      // Parse schema
      const schema = this.parseSchema();
      
      // Prepare context for templates
      const context = this.prepareContext(schema);
      
      // Generate project structure and base files
      this.generateProjectFiles(context);
      
      // Generate MCP protocol handlers
      this.generateMCPHandlers(context);
      
      // Generate server implementation
      this.generateServerImplementation(context);
      
      console.log('Code generation complete!');
      return true;
    } catch (error) {
      console.error('Error generating code:', error);
      return false;
    }
  }

  /**
   * Generate project structure and base files
   * @param {Object} context - Generation context
   */
  generateProjectFiles(context) {
    console.log('Generating project files...');
    
    // Generate package.json
    this.templateEngine.renderToFile(
      'package.json',
      path.join(this.outputDir, 'package.json'),
      context
    );
    
    // Generate README.md
    this.templateEngine.renderToFile(
      'README.md',
      path.join(this.outputDir, 'README.md'),
      context
    );
    
    // Generate tsconfig.json
    this.templateEngine.renderToFile(
      'tsconfig.json',
      path.join(this.outputDir, 'tsconfig.json'),
      context
    );
    
    // Generate .gitignore
    this.templateEngine.renderToFile(
      'gitignore',
      path.join(this.outputDir, '.gitignore'),
      context
    );
    
    // Copy MCP schema
    fs.copyFileSync(
      this.schemaPath,
      path.join(this.outputDir, 'src', 'schema', 'mcp-schema.ts')
    );
  }

  /**
   * Generate MCP protocol handlers
   * @param {Object} context - Generation context
   */
  generateMCPHandlers(context) {
    console.log('Generating MCP protocol handlers...');
    
    // Generate connection handler
    this.templateEngine.renderToFile(
      'src/handlers/connection-handler.ts',
      path.join(this.outputDir, 'src', 'handlers', 'connection-handler.ts'),
      context
    );
    
    // Generate message handler
    this.templateEngine.renderToFile(
      'src/handlers/message-handler.ts',
      path.join(this.outputDir, 'src', 'handlers', 'message-handler.ts'),
      context
    );
    
    // Generate request handlers
    for (const category in context.requestCategories) {
      this.templateEngine.renderToFile(
        'src/handlers/request-handler.ts',
        path.join(this.outputDir, 'src', 'handlers', `${category.toLowerCase()}-handler.ts`),
        {
          ...context,
          category,
          requests: context.requestCategories[category]
        }
      );
    }
  }

  /**
   * Generate server implementation
   * @param {Object} context - Generation context
   */
  generateServerImplementation(context) {
    console.log('Generating server implementation...');
    
    // Generate main server file
    this.templateEngine.renderToFile(
      'src/server.ts',
      path.join(this.outputDir, 'src', 'server.ts'),
      context
    );
    
    // Generate index file
    this.templateEngine.renderToFile(
      'src/index.ts',
      path.join(this.outputDir, 'src', 'index.ts'),
      context
    );
    
    // Generate capability manager
    this.templateEngine.renderToFile(
      'src/capabilities.ts',
      path.join(this.outputDir, 'src', 'capabilities.ts'),
      context
    );
    
    // Generate state manager
    this.templateEngine.renderToFile(
      'src/state-manager.ts',
      path.join(this.outputDir, 'src', 'state-manager.ts'),
      context
    );
    
    // Generate utility functions
    this.templateEngine.renderToFile(
      'src/utils.ts',
      path.join(this.outputDir, 'src', 'utils.ts'),
      context
    );
  }
}

module.exports = MCPServerGenerator;
