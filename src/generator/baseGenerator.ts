// Path: src/generator/generators/baseGenerator.ts
// Base class for all generators with common functionality

import { GeneratorOptions, AxeError } from '../../types';
import { logger, LogCategory } from '../../utils/logger';
import { createGeneratorError } from '../../utils/errorUtils';
import { getTemplateSystem, TemplateSystem } from '../../utils/templateSystem';
import { performance } from '../../utils/performanceUtils';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Base Generator class that provides common functionality for all generators.
 */
export abstract class BaseGenerator {
  protected templateSystem: TemplateSystem | null = null;
  protected initialized: boolean = false;

  /**
   * Initialize the generator with template engine setup
   */
  protected async initialize(options: GeneratorOptions): Promise<void> {
    if (this.initialized) {
      return;
    }

    logger.debug('Initializing generator...', LogCategory.GENERATOR);

    // Set up template engine
    const projectRoot = path.resolve(__dirname, '../../..');
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
    this.templateSystem = getTemplateSystem({
      baseDir: templatesDir,
      verbose: options.verbose || false
    });
    
    // Register common helper functions
    this.registerTemplateHelpers();
    
    // Load all templates
    this.templateSystem.preloadTemplates();
    
    this.initialized = true;
    logger.debug('Generator initialized successfully', LogCategory.GENERATOR);
  }

  /**
   * Register template helper functions
   */
  protected registerTemplateHelpers(): void {
    if (!this.templateSystem) return;

    this.templateSystem.registerHelper('isRequestType', (type: string) => 
      type.endsWith('Request'));
    
    this.templateSystem.registerHelper('isResponseType', (type: string) => 
      type.endsWith('Result') || type.endsWith('Response'));
    
    this.templateSystem.registerHelper('getResponseTypeForRequest', (requestType: string) => 
      requestType.replace('Request', 'Result'));
    
    this.templateSystem.registerHelper('getMethodFromRequest', (requestType: string) => {
      const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
      return methodParts.map(part => part.toLowerCase()).join('_');
    });
  }

  /**
   * Render a template to a file
   */
  protected async renderTemplate(
    templateName: string, 
    outputPath: string, 
    data: any
  ): Promise<void> {
    if (!this.templateSystem) {
      throw createGeneratorError(
        1101,
        'Template engine not initialized',
        { templateName, outputPath }
      );
    }

    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Render and write the file
      this.templateSystem.renderToFile(templateName, outputPath, data);
      
      logger.debug(`Generated file: ${path.basename(outputPath)}`, LogCategory.GENERATOR);
    } catch (error) {
      throw createGeneratorError(
        1200,
        `Failed to generate file from template: ${templateName}`,
        { templateName, outputPath },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generate a basic text file when a template is not available
   */
  protected generateBasicFile(outputPath: string, content: string): void {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the file
      fs.writeFileSync(outputPath, content, 'utf-8');
      
      logger.debug(`Generated basic file: ${path.basename(outputPath)}`, LogCategory.GENERATOR);
    } catch (error) {
      throw createGeneratorError(
        1201,
        `Failed to generate basic file`,
        { outputPath },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Create a base template data object with common fields
   */
  protected createBaseTemplateData(additionalData: Record<string, any> = {}): Record<string, any> {
    return {
      date: new Date().toISOString(),
      version: '0.1.0',
      ...additionalData
    };
  }
}

// Path: src/generator/generators/typesGenerator.ts
// Generator for types files

import { BaseGenerator } from './baseGenerator';
import { MappedService, GeneratorOptions } from '../../types';
import { logger, LogCategory } from '../../utils/logger';
import { performance } from '../../utils/performanceUtils';
import * as path from 'path';

/**
 * Generator for TypeScript type definitions
 */
export class TypesGenerator extends BaseGenerator {
  /**
   * Generate the types file
   */
  public async generate(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track('generate-types-file', async () => {
      logger.info('Generating types file...', LogCategory.GENERATOR);

      // Initialize the generator
      await this.initialize(options);

      // Prepare template data
      const templateData = this.createBaseTemplateData({
        service: mappedService
      });

      // Render and write the file
      const typesPath = path.join(options.outputDir, 'types.ts');
      await this.renderTemplate('types', typesPath, templateData);

      logger.success(`Generated types file: ${path.basename(typesPath)}`, LogCategory.GENERATOR);
    });
  }
}

// Path: src/generator/generators/handlerGenerator.ts
// Generator for resource handler files

import { BaseGenerator } from './baseGenerator';
import { MappedService, MappedResource, GeneratorOptions } from '../../types';
import { logger, LogCategory } from '../../utils/logger';
import { performance } from '../../utils/performanceUtils';
import * as path from 'path';
import { ValidationUtils } from '../../utils/validationUtils';

/**
 * Generator for resource handler files
 */
export class HandlerGenerator extends BaseGenerator {
  /**
   * Generate handler files for all resources
   */
  public async generate(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track('generate-handler-files', async () => {
      logger.info('Generating handler files...', LogCategory.GENERATOR);

      // Initialize the generator
      await this.initialize(options);

      // Create handlers directory
      const handlersDir = path.join(options.outputDir, 'handlers');
      await ValidationUtils.validateDirectory(
        handlersDir, 
        1007, 
        undefined, 
        true
      );

      // Generate a handler file for each resource
      for (const resource of mappedService.resources) {
        await this.generateResourceHandler(
          resource, 
          mappedService, 
          handlersDir, 
          options
        );
      }
    });
  }

  /**
   * Generate a handler file for a single resource
   */
  private async generateResourceHandler(
    resource: MappedResource,
    service: MappedService,
    handlersDir: string,
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track(`generate-handler-${resource.name.toLowerCase()}`, async () => {
      logger.info(`Generating handler for resource: ${resource.name}`, LogCategory.GENERATOR);

      // Prepare template data
      const templateData = this.createBaseTemplateData({
        resource,
        service
      });

      // Render and write the file
      const handlerPath = path.join(
        handlersDir, 
        `${resource.name.toLowerCase()}.ts`
      );
      
      await this.renderTemplate('handler', handlerPath, templateData);

      logger.success(
        `Generated handler file: ${path.basename(handlerPath)}`, 
        LogCategory.GENERATOR
      );
    });
  }
}

// Path: src/generator/generators/serverGenerator.ts
// Generator for server files

import { BaseGenerator } from './baseGenerator';
import { MappedService, GeneratorOptions } from '../../types';
import { logger, LogCategory } from '../../utils/logger';
import { performance } from '../../utils/performanceUtils';
import * as path from 'path';
import { ValidationUtils } from '../../utils/validationUtils';

/**
 * Generator for server-related files
 */
export class ServerGenerator extends BaseGenerator {
  /**
   * Generate the server file
   */
  public async generate(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track('generate-server-file', async () => {
      logger.info('Generating server file...', LogCategory.GENERATOR);

      // Initialize the generator
      await this.initialize(options);

      // Prepare template data
      const templateData = this.createBaseTemplateData({
        service: mappedService
      });

      // Render and write the file
      const serverPath = path.join(options.outputDir, 'server.ts');
      await this.renderTemplate('server', serverPath, templateData);

      logger.success(`Generated server file: ${path.basename(serverPath)}`, LogCategory.GENERATOR);

      // Generate utility files
      await this.generateUtilFiles(options);
    });
  }

  /**
   * Generate utility files for the server
   */
  private async generateUtilFiles(options: GeneratorOptions): Promise<void> {
    return performance.track('generate-util-files', async () => {
      logger.info('Generating utility files...', LogCategory.GENERATOR);

      // Create utils directory
      const utilsDir = path.join(options.outputDir, 'utils');
      await ValidationUtils.validateDirectory(utilsDir, 1008, undefined, true);

      // Prepare template data
      const templateData = this.createBaseTemplateData();

      // Generate logger utility
      await this.generateLoggerUtil(utilsDir, templateData);

      // Generate error handler utility
      await this.generateErrorHandlerUtil(utilsDir, templateData);
    });
  }

  /**
   * Generate logger utility
   */
  private async generateLoggerUtil(
    utilsDir: string, 
    templateData: Record<string, any>
  ): Promise<void> {
    const loggerPath = path.join(utilsDir, 'logger.ts');
    
    try {
      // Try to use template
      await this.renderTemplate('utils/logger', loggerPath, templateData);
      logger.success('Generated logger utility', LogCategory.GENERATOR);
    } catch (error) {
      // Create a basic logger
      const basicLogger = `// Generated by Axe Handle MCP Server Generator
// Date: ${templateData.date}

/**
 * Simple logger utility
 */
export const logger = {
  info: (message: string) => console.log(\`[INFO] \${message}\`),
  warn: (message: string) => console.warn(\`[WARN] \${message}\`),
  error: (message: string) => console.error(\`[ERROR] \${message}\`)
};
`;
      this.generateBasicFile(loggerPath, basicLogger);
      logger.success('Generated basic logger utility', LogCategory.GENERATOR);
    }
  }

  /**
   * Generate error handler utility
   */
  private async generateErrorHandlerUtil(
    utilsDir: string, 
    templateData: Record<string, any>
  ): Promise<void> {
    const errorHandlerPath = path.join(utilsDir, 'errorHandler.ts');
    
    try {
      // Try to use template
      await this.renderTemplate('utils/errorHandler', errorHandlerPath, templateData);
      logger.success('Generated error handler utility', LogCategory.GENERATOR);
    } catch (error) {
      // Create a basic error handler
      const basicErrorHandler = `// Generated by Axe Handle MCP Server Generator
// Date: ${templateData.date}

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
export function createErrorResponse(
  code: string, 
  message: string, 
  details?: Record<string, unknown>
): ErrorResponse {
  return { code, message, details };
}
`;
      this.generateBasicFile(errorHandlerPath, basicErrorHandler);
      logger.success('Generated basic error handler utility', LogCategory.GENERATOR);
    }
  }
}

// Path: src/generator/generators/indexGenerator.ts
// Generator for index files

import { BaseGenerator } from './baseGenerator';
import { MappedService, GeneratorOptions } from '../../types';
import { logger, LogCategory } from '../../utils/logger';
import { performance } from '../../utils/performanceUtils';
import * as path from 'path';

/**
 * Generator for index file (entry point)
 */
export class IndexGenerator extends BaseGenerator {
  /**
   * Generate the index file
   */
  public async generate(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track('generate-index-file', async () => {
      logger.info('Generating index file...', LogCategory.GENERATOR);

      // Initialize the generator
      await this.initialize(options);

      // Prepare template data
      const templateData = this.createBaseTemplateData({
        service: mappedService
      });

      // Render and write the file
      const indexPath = path.join(options.outputDir, 'index.ts');
      await this.renderTemplate('index', indexPath, templateData);

      logger.success(`Generated index file: ${path.basename(indexPath)}`, LogCategory.GENERATOR);
    });
  }
}

// Path: src/generator/generators/projectFilesGenerator.ts
// Generator for project configuration files

import { BaseGenerator } from './baseGenerator';
import { MappedService, GeneratorOptions } from '../../types';
import { logger, LogCategory } from '../../utils/logger';
import { performance } from '../../utils/performanceUtils';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Generator for project configuration files
 */
export class ProjectFilesGenerator extends BaseGenerator {
  /**
   * Generate project files (package.json, tsconfig.json, etc.)
   */
  public async generate(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track('generate-project-files', async () => {
      logger.info('Generating project files...', LogCategory.GENERATOR);

      // Initialize the generator
      await this.initialize(options);

      // Prepare template data
      const templateData = this.createBaseTemplateData({
        service: mappedService,
        config: {
          projectName: mappedService.name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          author: process.env.USER || 'MCP Generator User',
          version: '0.1.0',
          description: `MCP server for ${mappedService.name}`,
          license: 'MIT'
        }
      });

      // Generate package.json
      await this.generatePackageJson(mappedService, options, templateData);

      // Generate tsconfig.json
      await this.generateTsConfig(options, templateData);

      // Generate README.md
      await this.generateReadme(mappedService, options, templateData);
    });
  }

  /**
   * Generate package.json file
   */
  private async generatePackageJson(
    mappedService: MappedService,
    options: GeneratorOptions,
    templateData: Record<string, any>
  ): Promise<void> {
    const packageJsonPath = path.join(options.outputDir, 'package.json');
    
    try {
      // Try to use template
      await this.renderTemplate('package.json', packageJsonPath, templateData);
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
      
      this.generateBasicFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );
      
      logger.success('Generated basic package.json', LogCategory.GENERATOR);
    }
  }

  /**
   * Generate tsconfig.json file
   */
  private async generateTsConfig(
    options: GeneratorOptions,
    templateData: Record<string, any>
  ): Promise<void> {
    const tsconfigPath = path.join(options.outputDir, 'tsconfig.json');
    
    try {
      // Try to use template
      await this.renderTemplate('tsconfig.json', tsconfigPath, templateData);
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
        include: ['**/*.ts'],
        exclude: ['node_modules']
      };
      
      this.generateBasicFile(
        tsconfigPath,
        JSON.stringify(tsconfig, null, 2)
      );
      
      logger.success('Generated basic tsconfig.json', LogCategory.GENERATOR);
    }
  }

  /**
   * Generate README.md file
   */
  private async generateReadme(
    mappedService: MappedService,
    options: GeneratorOptions,
    templateData: Record<string, any>
  ): Promise<void> {
    const readmePath = path.join(options.outputDir, 'README.md');
    
    try {
      // Try to use template
      await this.renderTemplate('README.md', readmePath, templateData);
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
      
      this.generateBasicFile(readmePath, readme);
      logger.success('Generated basic README.md', LogCategory.GENERATOR);
    }
  }
}

// Path: src/generator/generators/documentationGenerator.ts
// Generator for API documentation

import { BaseGenerator } from './baseGenerator';
import { MappedService, GeneratorOptions } from '../../types';
import { logger, LogCategory } from '../../utils/logger';
import { performance } from '../../utils/performanceUtils';
import * as path from 'path';
import { ValidationUtils } from '../../utils/validationUtils';

/**
 * Generator for API documentation
 */
export class DocumentationGenerator extends BaseGenerator {
  /**
   * Generate API documentation
   */
  public async generate(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track('generate-documentation', async () => {
      logger.info('Generating API documentation...', LogCategory.GENERATOR);

      // Initialize the generator
      await this.initialize(options);

      // Create docs directory
      const docsDir = path.join(options.outputDir, 'docs');
      await ValidationUtils.validateDirectory(docsDir, 1009, undefined, true);

      // Prepare template data
      const templateData = this.createBaseTemplateData({
        service: mappedService
      });

      // Render and write the file
      const apiDocPath = path.join(docsDir, 'api.md');
      await this.renderTemplate('api', apiDocPath, templateData);

      logger.success(
        `Generated API documentation: ${path.relative(options.outputDir, apiDocPath)}`, 
        LogCategory.GENERATOR
      );
    });
  }
}

// Path: src/generator/mcpServerGenerator.ts
// Updated main generator that coordinates the specialized generators

import { MappedService, GeneratorOptions } from '../types';
import { logger, LogCategory } from '../utils/logger';
import { createGeneratorError } from '../utils/errorUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { performance } from '../utils/performanceUtils';
import { createAsyncErrorBoundary } from '../utils/errorBoundary';
import { TypesGenerator } from './generators/typesGenerator';
import { HandlerGenerator } from './generators/handlerGenerator';
import { ServerGenerator } from './generators/serverGenerator';
import { IndexGenerator } from './generators/indexGenerator';
import { ProjectFilesGenerator } from './generators/projectFilesGenerator';
import { DocumentationGenerator } from './generators/documentationGenerator';

/**
 * MCP Server Generator.
 * Coordinates specialized generators to produce a complete MCP server.
 */
class McpServerGenerator {
  private static instance: McpServerGenerator;
  private typesGenerator: TypesGenerator;
  private handlerGenerator: HandlerGenerator;
  private serverGenerator: ServerGenerator;
  private indexGenerator: IndexGenerator;
  private projectFilesGenerator: ProjectFilesGenerator;
  private documentationGenerator: DocumentationGenerator;

  /**
   * Creates a new Generator instance.
   * Private to enforce singleton pattern.
   */
  private constructor() {
    this.typesGenerator = new TypesGenerator();
    this.handlerGenerator = new HandlerGenerator();
    this.serverGenerator = new ServerGenerator();
    this.indexGenerator = new IndexGenerator();
    this.projectFilesGenerator = new ProjectFilesGenerator();
    this.documentationGenerator = new DocumentationGenerator();
  }

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
   * Validate all inputs before generation
   */
  private async validateInputs(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
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
        `Output directory is not empty and overwrite is not enabled: ${options.outputDir}`,
        true // Enable prompting
      );

      // Generate all components
      await this.typesGenerator.generate(mappedService, options);
      await this.handlerGenerator.generate(mappedService, options);
      await this.serverGenerator.generate(mappedService, options);
      await this.indexGenerator.generate(mappedService, options);
      await this.projectFilesGenerator.generate(mappedService, options);

      // Generate documentation (if enabled)
      if (options.generateDocs) {
        await this.documentationGenerator.generate(mappedService, options);
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
}

// Export singleton instance
export const mcpServerGenerator = McpServerGenerator.getInstance();
