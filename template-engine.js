// template-engine.js - Handles template rendering for code generation
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const mkdirp = require('mkdirp');

/**
 * Template Engine for MCP Server Generator
 * Manages template loading, context preparation, and rendering process
 */
class TemplateEngine {
  /**
   * Create a new template engine instance
   * @param {string} templateDir - Path to directory containing templates
   */
  constructor(templateDir) {
    this.templateDir = templateDir;
    this.templates = {};
    this.helpers = {
      // Common helper functions for templates
      capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
      camelCase: (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
      pascalCase: (str) => {
        const camel = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return camel.charAt(0).toUpperCase() + camel.slice(1);
      },
      snakeCase: (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase(),
      kebabCase: (str) => str.replace(/([A-Z])/g, '-$1').toLowerCase(),
    };
  }

  /**
   * Load all templates from the template directory
   */
  loadTemplates() {
    console.log(`Loading templates from ${this.templateDir}`);
    this._loadTemplatesRecursive(this.templateDir);
  }

  /**
   * Load templates recursively from a directory
   * @param {string} dir - Directory path to load from
   * @param {string} [prefix=''] - Path prefix for template names
   * @private
   */
  _loadTemplatesRecursive(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively load templates from subdirectories
        this._loadTemplatesRecursive(fullPath, `${prefix}${entry.name}/`);
      } else if (entry.name.endsWith('.ejs')) {
        // Load EJS template files
        const templateName = `${prefix}${entry.name.slice(0, -4)}`; // Remove '.ejs'
        this.templates[templateName] = fs.readFileSync(fullPath, 'utf8');
        console.log(`Loaded template: ${templateName}`);
      }
    }
  }

  /**
   * Register a custom helper function
   * @param {string} name - Helper name
   * @param {Function} fn - Helper function
   */
  registerHelper(name, fn) {
    this.helpers[name] = fn;
  }

  /**
   * Render a template with the given context
   * @param {string} templateName - Name of the template to render
   * @param {Object} context - Data context for rendering
   * @returns {string} Rendered content
   */
  render(templateName, context = {}) {
    if (!this.templates[templateName]) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Combine context with helper functions
    const fullContext = {
      ...context,
      ...this.helpers,
    };

    try {
      return ejs.render(this.templates[templateName], fullContext);
    } catch (error) {
      throw new Error(`Error rendering template '${templateName}': ${error.message}`);
    }
  }

  /**
   * Write rendered content to a file
   * @param {string} outputPath - Output file path
   * @param {string} content - Content to write
   */
  writeFile(outputPath, content) {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    mkdirp.sync(dir);
    
    // Write file
    fs.writeFileSync(outputPath, content);
    console.log(`Generated: ${outputPath}`);
  }

  /**
   * Render a template and write it to a file
   * @param {string} templateName - Name of the template to render
   * @param {string} outputPath - Output file path
   * @param {Object} context - Data context for rendering
   */
  renderToFile(templateName, outputPath, context = {}) {
    const content = this.render(templateName, context);
    this.writeFile(outputPath, content);
  }
}

module.exports = TemplateEngine;
