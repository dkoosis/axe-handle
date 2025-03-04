// Path: src/generator/mcpServerGenerator.ts
// Core code generation functionality for the Axe Handle tool.

import * as path from 'path';
import * as fs from 'fs';
import { MappedService, GeneratorOptions } from '../types';
import { logger, LogCategory } from '../utils/logger';
import { createGeneratorError } from '../utils/errorUtils';
import TemplateEngine from '../utils/templateEngine';
import { ValidationUtils } from '../utils/validationUtils';
import { performance } from '../utils/performanceUtils';
import { createAsyncErrorBoundary } from '../utils/errorBoundary';

/**
 * MCP Server Generator.
 * Handles the generation of server code for MCP-compliant applications
 * with improved error handling, validation, and performance tracking.
 */
class McpServerGenerator {
  private static instance: McpServerGenerator;
  private initialized: boolean = false;
  private templateEngine: TemplateEngine | null = null;

  /**
   * Creates a new Generator instance.
   * Private to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Gets the singleton instance of the Generator.
   * @returns The Generator instance
   */
  public static getInstance(): McpServerGenerator {
    if (!McpServerGenerator.instance) {
      McpServerGenerator.instance = new McpServerGenerator();
    }
    return McpServerGenerator.instance;
  }

  /**
   * Initialize the generator with template engine setup
   */
  private async initialize(options: GeneratorOptions): Promise<void> {
    if (this.initialized) {
      return;
    }

    logger.debug('Initializing MCP server generator...', LogCategory.GENERATOR);

    // Set up template engine
    const projectRoot = path.resolve(__dirname, '../..');
    const templatesDir = path.join(projectRoot, 'templates');
    
    if (!fs.existsSync(templatesDir)) {
      logger.error(`Templates directory not found: ${templatesDir}`, LogCategory.GENERATOR);
      throw createGeneratorError(
        1100,
        'Templates directory not found. Run prebuild script to create it.',
        { templatesDir }
      );
    }
    
    // Create template engine with verbose mode if requested
    this.templateEngine = new TemplateEngine(templatesDir, options.verbose || false);
    
    // Register common helper functions for templates
    this.templateEngine.registerHelper('isRequestType', (type: string) => type.endsWith('Request'));
    this.templateEngine.registerHelper('isResponseType', (type: string) => type.endsWith('Result') || type.endsWith('Response'));
    this.templateEngine.registerHelper('getResponseTypeForRequest', (requestType: string) => requestType.replace('Request', 'Result'));
    this.templateEngine.registerHelper('getMethodFromRequest', (requestType: string) => {
      const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
      return methodParts.map(part => part.toLowerCase()).join('_');
    });
    
    // Load all templates
    this.templateEngine.loadTemplates();
    
    this.initialized = true;
    logger.debug('MCP server generator initialized successfully', LogCategory.GENERATOR);
  }

  /**
   * Generates server code for the mapped service.
   * @param mappedService The mapped service
   * @param options Generator options
   * @throws Error if generation fails
   */
  public generateServer = createAsyncErrorBoundary(
    async (mappedService: MappedService, options: GeneratorOptions): Promise<void> => {
      // Start performance tracking for the entire generation process
      performance.start('generate-server', { 
        serviceName: mappedService.name,
        resourceCount: mappedService.resources.length,
        typeCount: mappedService.types.length
      });

      logger.section('Code Generation');
      logger.info(`Generating code for service: ${mappedService.name}`, LogCategory.GENERATOR);

      // Validate inputs
      await this.validateInputs(mappedService, options);

      // Initialize the generator
      await this.initialize(options);
      
      // Ensure we have a template engine
      if (!this.templateEngine) {
        throw createGeneratorError(
          1101,
          'Template engine not initialized',
          { options }
        );
      }
      
      // Create output directory
      await ValidationUtils.validateDirectory(
        options.outputDir, 
        1001, 
        `Failed to create output directory: ${options.outputDir}`,
        true
      );

      // Validate that directory is empty or overwrite is enabled
      await ValidationUtils.validateEmptyOrOverwrite(
        options.outputDir,
        options.overwrite || false,
        1002,
        `Output directory is not empty and overwrite is not enabled: ${options.outputDir}`
      );

      // Generate all components
      await this.generateTypesFile(mappedService, options);
      await this.generateHandlerFiles(mappedService, options);
      await this.generateServerFile(mappedService, options);
      await this.generateIndexFile(mappedService, options);
      await this.generateProjectFiles(mappedService, options);

      // Generate documentation (if enabled)
      if (options.generateDocs) {
        await this.generateDocumentation(mappedService, options);
      }

      // End performance tracking
      performance.end('generate-server');

      // Log performance summary
      if (options.verbose) {
        performance.logSummary();
      }

      logger.success(`Code generation completed for service: ${mappedService.name}`, LogCategory.GENERATOR);
    },
    {
      operation: 'generate-server',
      category: LogCategory.GENERATOR,
      errorCode: 1000
    }
  );

  /**
   * Validate all inputs before generation
   */
  private async validateInputs(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    logger.debug('Validating inputs...', LogCategory.GENERATOR);

    // Validate service
    if (!mappedService) {
      throw createGeneratorError(
        1003,
        'Missing mapped service',
        { options }
      );
    }

    // Validate service properties
    ValidationUtils.validateString(
      mappedService.name,
      'service.name',
      1004,
      { minLength: 1, maxLength: 100 }
    );

    // Validate resources
    if (!mappedService.resources || mappedService.resources.length === 0) {
      throw createGeneratorError(
        1005,
        'Service has no resources',
        { serviceName: mappedService.name }
      );
    }

    // Validate options
    ValidationUtils.validateString(
      options.outputDir,
      'options.outputDir',
      1006,
      { minLength: 1 }
    );

    logger.debug('Input validation successful', LogCategory.GENERATOR);
  }

  /**
   * Generates the types file.
   */
  private async generateTypesFile(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-types-file', async () => {
      logger.info('Generating types file...', LogCategory.GENERATOR);

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Ensure template engine is initialized
      if (!this.templateEngine) {
        throw createGeneratorError(
          1102,
          'Template engine not initialized',
          { operation: 'generateTypesFile' }
        );
      }

      try {
        // Render and write the file
        const typesPath = path.join(options.outputDir, 'types.ts');
        this.templateEngine.renderToFile('types', typesPath, templateData);

        logger.success(`Generated types file: ${path.basename(typesPath)}`, LogCategory.GENERATOR);
      } catch (error) {
        // Add more context to the error
        logger.error(`Failed to generate types file: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
        
        throw createGeneratorError(
          1200,
          'Failed to generate types file',
          { 
            service: mappedService.name,
            templateName: 'types'
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });
  }

  /**
   * Generates handler files for each resource.
   */
  private async generateHandlerFiles(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-handler-files', async () => {
      logger.info('Generating handler files...', LogCategory.GENERATOR);

      // Create handlers directory
      const handlersDir = path.join(options.outputDir, 'handlers');
      await ValidationUtils.validateDirectory(handlersDir, 1007, undefined, true);

      // Ensure template engine is initialized
      if (!this.templateEngine) {
        throw createGeneratorError(
          1103,
          'Template engine not initialized',
          { operation: 'generateHandlerFiles' }
        );
      }

      // Generate a handler file for each resource
      for (const resource of mappedService.resources) {
        await performance.track(`generate-handler-${resource.name.toLowerCase()}`, async () => {
          logger.info(`Generating handler for resource: ${resource.name}`, LogCategory.GENERATOR);

          try {
            // Prepare template data
            const templateData = {
              resource,
              service: mappedService,
              date: new Date().toISOString(),
              version: '0.1.0'
            };

            // Render and write the file
            const handlerPath = path.join(handlersDir, `${resource.name.toLowerCase()}.ts`);
            this.templateEngine!.renderToFile('handler', handlerPath, templateData);

            logger.success(`Generated handler file: ${path.basename(handlerPath)}`, LogCategory.GENERATOR);
          } catch (error) {
            logger.error(`Failed to generate handler for ${resource.name}: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
            
            throw createGeneratorError(
              1201,
              `Failed to generate handler for ${resource.name}`,
              { 
                service: mappedService.name,
                resource: resource.name,
                templateName: 'handler'
              },
              error instanceof Error ? error : new Error(String(error))
            );
          }
        });
      }
    });
  }

  /**
   * Generates the server file.
   */
  private async generateServerFile(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-server-file', async () => {
      logger.info('Generating server file...', LogCategory.GENERATOR);

      // Ensure template engine is initialized
      if (!this.templateEngine) {
        throw createGeneratorError(
          1104,
          'Template engine not initialized',
          { operation: 'generateServerFile' }
        );
      }

      try {
        // Prepare template data
        const templateData = {
          service: mappedService,
          date: new Date().toISOString(),
          version: '0.1.0'
        };

        // Render and write the file
        const serverPath = path.join(options.outputDir, 'server.ts');
        this.templateEngine.renderToFile('server', serverPath, templateData);

        logger.success(`Generated server file: ${path.basename(serverPath)}`, LogCategory.GENERATOR);

        // Generate utility files
        await this.generateUtilFiles(options);
      } catch (error) {
        logger.error(`Failed to generate server file: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
        
        throw createGeneratorError(
          1202,
          'Failed to generate server file',
          { 
            service: mappedService.name,
            templateName: 'server'
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });
  }

  /**
   * Generates utility files.
   */
  private async generateUtilFiles(options: GeneratorOptions): Promise<void> {
    return performance.track('generate-util-files', async () => {
      logger.info('Generating utility files...', LogCategory.GENERATOR);

      // Create utils directory
      const utilsDir = path.join(options.outputDir, 'utils');
      await ValidationUtils.validateDirectory(utilsDir, 1008, undefined, true);

      // Ensure template engine is initialized
      if (!this.templateEngine) {
        throw createGeneratorError(
          1105,
          'Template engine not initialized',
          { operation: 'generateUtilFiles' }
        );
      }

      // Prepare template data
      const templateData = {
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Create a minimal logger utility if template isn't available
      try {
        const loggerPath = path.join(utilsDir, 'logger.ts');
        try {
          // Try to use template
          this.templateEngine.renderToFile('utils/logger', loggerPath, templateData);
          logger.success('Generated logger utility', LogCategory.GENERATOR);
        } catch (error) {
          // Create a basic logger
          const basicLogger = `// Generated by Axe Handle MCP Server Generator
// Date: ${new Date().toISOString()}

/**
 * Simple logger utility
 */
export const logger = {
  info: (message: string) => console.log(\`[INFO] \${message}\`),
  warn: (message: string) => console.warn(\`[WARN] \${message}\`),
  error: (message: string) => console.error(\`[ERROR] \${message}\`)
};
`;
          fs.writeFileSync(loggerPath, basicLogger);
          logger.success('Generated basic logger utility', LogCategory.GENERATOR);
        }
      } catch (error) {
        // Non-fatal error
        logger.warn(`Could not generate logger utility: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
      }

      // Basic error handler
      try {
        const errorHandlerPath = path.join(utilsDir, 'errorHandler.ts');
        try {
          this.templateEngine.renderToFile('utils/errorHandler', errorHandlerPath, templateData);
          logger.success('Generated error handler utility', LogCategory.GENERATOR);
        } catch (error) {
          // Create a basic error handler
          const basicErrorHandler = `// Generated by Axe Handle MCP Server Generator
// Date: ${new Date().toISOString()}

/**
 * Error response interface
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Creates an error response object
 */
export function createErrorResponse(code: string, message: string, details?: Record<string, unknown>): ErrorResponse {
  return { code, message, details };
}
`;
          fs.writeFileSync(errorHandlerPath, basicErrorHandler);
          logger.success('Generated basic error handler utility', LogCategory.GENERATOR);
        }
      } catch (error) {
        // Non-fatal error
        logger.warn(`Could not generate error handler utility: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
      }
    });
  }

  /**
   * Generates the index file.
   */
  private async generateIndexFile(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-index-file', async () => {
      logger.info('Generating index file...', LogCategory.GENERATOR);

      // Ensure template engine is initialized
      if (!this.templateEngine) {
        throw createGeneratorError(
          1106,
          'Template engine not initialized',
          { operation: 'generateIndexFile' }
        );
      }

      try {
        // Prepare template data
        const templateData = {
          service: mappedService,
          date: new Date().toISOString(),
          version: '0.1.0'
        };

        // Render and write the file
        const indexPath = path.join(options.outputDir, 'index.ts');
        this.templateEngine.renderToFile('index', indexPath, templateData);

        logger.success(`Generated index file: ${path.basename(indexPath)}`, LogCategory.GENERATOR);
      } catch (error) {
        logger.error(`Failed to generate index file: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
        
        throw createGeneratorError(
          1203,
          'Failed to generate index file',
          { 
            service: mappedService.name,
            templateName: 'index'
          },
          error instanceof Error ? error : new Error(String(error))
        );
      }
    });
  }

  /**
   * Generates project files (package.json, tsconfig.json, etc.)
   */
  private async generateProjectFiles(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-project-files', async () => {
      logger.info('Generating project files...', LogCategory.GENERATOR);

      // Ensure template engine is initialized
      if (!this.templateEngine) {
        throw createGeneratorError(
          1107,
          'Template engine not initialized',
          { operation: 'generateProjectFiles' }
        );
      }

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0',
        config: {
          projectName: mappedService.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          author: process.env.USER || 'MCP Generator User',
          version: '0.1.0',
          description: `MCP server for ${mappedService.name}`,
          license: 'MIT'
        }
      };

      try {
        // Generate package.json
        try {
          const packageJsonPath = path.join(options.outputDir, 'package.json');
          this.templateEngine.renderToFile('package.json', packageJsonPath, templateData);
          logger.success('Generated package.json', LogCategory.GENERATOR);
        } catch (error) {
          // Create a minimal package.json
          const packageJson = {
            name: mappedService.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            version: '0.1.0',
            description: `MCP server for ${mappedService.name}`,
            main: 'dist/index.js',
            scripts: {
              build: 'tsc',
              start: 'node dist/index.js',
              dev: 'ts-node src/index.ts'
            },
            dependencies: {
              express: '^4.18.2',
              uuid: '^9.0.0'
            },
            devDependencies: {
              typescript: '^5.0.0',
              '@types/express': '^4.17.17',
              '@types/node': '^18.0.0',
              '@types/uuid': '^9.0.0',
              'ts-node': '^10.9.1'
            }
          };
          
          fs.writeFileSync(
            path.join(options.outputDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
          );
          
          logger.success('Generated basic package.json', LogCategory.GENERATOR);
        }

        // Generate tsconfig.json
        try {
          const tsconfigPath = path.join(options.outputDir, 'tsconfig.json');
          this.templateEngine.renderToFile('tsconfig.json', tsconfigPath, templateData);
          logger.success('Generated tsconfig.json', LogCategory.GENERATOR);
        } catch (error) {
          // Create a minimal tsconfig.json
          const tsconfig = {
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              esModuleInterop: true,
              strict: true,
              skipLibCheck: true,
              outDir: './dist',
              sourceMap: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules']
          };
          
          fs.writeFileSync(
            path.join(options.outputDir, 'tsconfig.json'),
            JSON.stringify(tsconfig, null, 2)
          );
          
          logger.success('Generated basic tsconfig.json', LogCategory.GENERATOR);
        }

        // Generate README.md
        try {
          const readmePath = path.join(options.outputDir, 'README.md');
          this.templateEngine.renderToFile('README.md', readmePath, templateData);
          logger.success('Generated README.md', LogCategory.GENERATOR);
        } catch (error) {
          // Create a minimal README.md
          const readme = `# ${mappedService.name} MCP Server

Generated by Axe Handle MCP Server Generator

## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Running the Server

\`\`\`bash
# Development
npm run dev

# Production
npm run build
npm start
\`\`\`
`;
          
          fs.writeFileSync(path.join(options.outputDir, 'README.md'), readme);
          logger.success('Generated basic README.md', LogCategory.GENERATOR);
        }
      } catch (error) {
        logger.error(`Failed to generate project files: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
        
        // This is a non-critical error, so we'll just log it and continue
        logger.warn('Some project files may be missing or incomplete', LogCategory.GENERATOR);
      }
    });
  }

  /**
   * Generates API documentation.
   */
  private async generateDocumentation(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-documentation', async () => {
      logger.info('Generating API documentation...', LogCategory.GENERATOR);

      // Ensure template engine is initialized
      if (!this.templateEngine) {
        throw createGeneratorError(
          1108,
          'Template engine not initialized',
          { operation: 'generateDocumentation' }
        );
      }

      try {
        // Create docs directory
        const docsDir = path.join(options.outputDir, 'docs');
        await ValidationUtils.validateDirectory(docsDir, 1009, undefined, true);

        // Prepare template data
        const templateData = {
          service: mappedService,
          date: new Date().toISOString(),
          version: '0.1.0'
        };

        // Render and write the file
        const apiDocPath = path.join(docsDir, 'api.md');
        this.templateEngine.renderToFile('api', apiDocPath, templateData);

        logger.success(`Generated API documentation: ${path.relative(options.outputDir, apiDocPath)}`, LogCategory.GENERATOR);
      } catch (error) {
        logger.error(`Failed to generate API documentation: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
        
        // This is not critical, so just log the error and continue
        logger.warn('API documentation may be missing or incomplete', LogCategory.GENERATOR);
      }
    });
  }