// Path: templates/express/src/mcpServerGenerator.ts
import path from 'path';
import fs from 'fs';
import { parseMCPSchema, MCPInterface } from './mcpSchemaParser'; // Rule 1, 3: Descriptive filename
import TemplateEngine from './templateEngine'; // Rule 1: Descriptive filename

/**
 * @fileoverview Main code generator for MCP servers.
 * @path axe-handle/mcpServerGenerator.ts
 */

/**
 * Options for the MCP Server Generator.
 */
interface MCPServerGeneratorOptions {
  schemaPath: string;
  outputDir: string;
  templateDir?: string;
  framework?: 'express' | 'nestjs' | 'fastify'; //  Specific framework types
  config?: Partial<MCPGeneratorConfig>; //  Partial allows overriding specific config options
}

/**
 * Configuration for the MCP Server Generator.
 */
interface MCPGeneratorConfig {
  projectName: string;
  author: string;
  version: string;
  description: string;
  license: string;
}

/**
 * Context data provided to templates during code generation.
 */
interface TemplateContext {
  schema: any; // Ideally, this should be a strongly-typed schema object
  config: MCPGeneratorConfig;
  timestamp: string;
  requests: MCPInterface[];
  responses: MCPInterface[];
  notifications: MCPInterface[];
  requestCategories: Record<string, MCPInterface[]>; // Grouped requests
  protocolVersion: string;
  framework: 'express' | 'nestjs' | 'fastify';
}

/**
 * MCP Server Code Generator
 * Coordinates the generation of MCP server code from a schema definition.
 */
class MCPServerGenerator {
  private schemaPath: string;
  private outputDir: string;
  private templateDir: string;
  private framework: 'express' | 'nestjs' | 'fastify';
  private config: MCPGeneratorConfig;
  private templateEngine: TemplateEngine;

  /**
   * Creates a new MCP Server Generator.
   * @param options Generator options.
   */
  constructor(options: MCPServerGeneratorOptions) {
    this.schemaPath = options.schemaPath;
    this.outputDir = options.outputDir;
    this.templateDir = options.templateDir || path.join(__dirname, 'templates');
    this.framework = options.framework || 'express';

    // Default configuration with overrides
    this.config = {
      projectName: 'mcp-server',
      author: process.env.USER || 'MCP Generator User',
      version: '1.0.0',
      description: 'MCP Protocol Server',
      license: 'MIT',
      ...options.config, // Allow user to override default config
    };

    this.templateEngine = new TemplateEngine(
      path.join(this.templateDir, this.framework)
    );
  }

  /**
   * Initializes the generator.
   * Loads templates and registers custom helpers.
   */
  public initialize(): void { // Rule 8: Added 'public' for clarity
    console.log('Initializing MCP Server Generator...');

    this.templateEngine.loadTemplates();

    // Register custom helpers (arrow functions for concise syntax)
    this.templateEngine.registerHelper('isRequestType', (type: string) => type.endsWith('Request')); // Rule 6, 10
    this.templateEngine.registerHelper('isResponseType', (type: string) => type.endsWith('Result') || type.endsWith('Response')); // Rule 6, 10
    this.templateEngine.registerHelper('getResponseTypeForRequest', (requestType: string) => requestType.replace('Request', 'Result')); // Rule 9
    this.templateEngine.registerHelper('getMethodFromRequest', (requestType: string) => { // Rule 8, 9
      const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
      return methodParts.map(part => part.toLowerCase()).join('_');
    });
  }

  /**
   * Parses the MCP schema.
   * @returns Parsed schema.
   */
  private parseSchema(): any { // Rule 25, Ideally should return a specific type
    console.log(`Parsing schema from ${this.schemaPath}...`);
    return parseMCPSchema(this.schemaPath);
  }

  /**
   * Prepares the generation context from the schema.
   * @param schema Parsed MCP schema.
   * @returns Generation context.
   */
    private prepareContext(schema: any): TemplateContext { // Rule 17, 25 - Should have a more precise schema type.
        // Rule 17, 27. If MCPInterface is return type from parseMCPSchema, use that.

    const extractAndSort = (suffix: string) =>
      Object.values(schema.interfaces)
        .filter((iface: MCPInterface) => iface.name.endsWith(suffix))
        .sort((a: MCPInterface, b: MCPInterface) => a.name.localeCompare(b.name)); // Rule 4, 5, 17

    const requests: MCPInterface[] = extractAndSort('Request');  // Rule 5
    const responses: MCPInterface[] = extractAndSort('Result').concat(extractAndSort('Response')); // Rule 5
    const notifications: MCPInterface[] = extractAndSort('Notification'); // Rule 5

        // Group requests by category (based on common prefix)
        const requestCategories: Record<string, MCPInterface[]> = {};
        for (const request of requests) { // Rule 4
            const category = request.name.replace('Request', '').replace(/[A-Z][a-z]+$/, '');  // Rule 4, 5
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
      protocolVersion: schema.version, // Rule 5: Descriptive variable name
      framework: this.framework,
    };
  }

  /**
   * Generates server code.
   */
  public async generate(): Promise<boolean> { // Rule 8: Verb for function name
    try {
      this.initialize();

      const schema = this.parseSchema();
      const context = this.prepareContext(schema);

      this.generateProjectFiles(context);
      this.generateMCPHandlers(context);
      this.generateServerImplementation(context);

      console.log('Code generation complete!');
      return true;
    } catch (error) {
      console.error('Error generating code:', error);
      return false;
    }
  }

  /**
   * Generates project structure and base files.
   * @param context Generation context.
   */
    private generateProjectFiles(context: TemplateContext): void {
    console.log('Generating project files...');

    const renderTo = (templateName: string, outputPath: string) => {  // Rule 4, 5
      this.templateEngine.renderToFile(templateName, path.join(this.outputDir, outputPath), context);
    };

    renderTo('package.json', 'package.json');
    renderTo('README.md', 'README.md');
    renderTo('tsconfig.json', 'tsconfig.json');
    renderTo('gitignore', '.gitignore');

    // Copy MCP schema, creating the directory if it doesn't exist
    const schemaDir = path.join(this.outputDir, 'src', 'schema');
    if (!fs.existsSync(schemaDir)) { // Rule 26: Check to prevent errors.
        fs.mkdirSync(schemaDir, { recursive: true });  // Ensure directory exists
    }
    fs.copyFileSync(this.schemaPath, path.join(schemaDir, 'mcp-protocol.ts'));
  }

  /**
   * Generates MCP protocol handlers.
   * @param context Generation context.
   */
    private generateMCPHandlers(context: TemplateContext): void {
    console.log('Generating MCP protocol handlers...');

        const renderHandler = (templateName: string, filePath: string, handlerContext?: any) => { // Rule 4
      this.templateEngine.renderToFile(
        templateName,
        path.join(this.outputDir, filePath),
        handlerContext || context // Default to the main context if no specific context is provided
      );
    };


    renderHandler('src/handlers/connectionHandler.ts', 'src/handlers/connectionHandler.ts'); // Rule 1, 3: Descriptive filenames
    renderHandler('src/handlers/messageHandler.ts', 'src/handlers/messageHandler.ts');    // Rule 1, 3: Descriptive filenames

    for (const category in context.requestCategories) {  // Rule 4
            renderHandler('src/handlers/requestHandler.ts', `src/handlers/${category.toLowerCase()}Handler.ts`, { // Rule 1, 3: Descriptive filenames
        ...context,
        category,
        requests: context.requestCategories[category],
      });
    }
  }

  /**
   * Generates the server implementation.
   * @param context Generation context.
   */
  private generateServerImplementation(context: TemplateContext): void {
    console.log('Generating server implementation...');
        const renderImpl = (templateName: string, filePath: string) => { // Rule 4
      this.templateEngine.renderToFile(
        templateName,
        path.join(this.outputDir, filePath),
        context
      );
    };

    renderImpl('src/server.ts', 'src/server.ts');
    renderImpl('src/index.ts', 'src/index.ts');
    renderImpl('src/capabilitiesManager.ts', 'src/capabilitiesManager.ts'); // Rule 1: Descriptive filenames
    renderImpl('src/stateManager.ts', 'src/stateManager.ts');           // Rule 1: Descriptive filenames
    renderImpl('src/utilities.ts', 'src/utilities.ts');                // Rule 1: Descriptive filenames
  }
}

export default MCPServerGenerator;