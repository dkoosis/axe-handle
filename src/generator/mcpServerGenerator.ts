// Path: src/generator/mcpServerGenerator.ts
// Core code generation functionality for the Axe Handle tool.

import * as fs from 'fs/promises';
import * as path from 'path';
import { MappedService, GeneratorOptions } from '../types';
import { logger, LogCategory } from '../utils/logger';
import { createGeneratorError } from '../utils/errorUtils';
import { getTemplateSystem } from '../utils/templateSystem';
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
   * Initialize the generator
   */
  private async initialize(options: GeneratorOptions): Promise<void> {
    if (this.initialized) {
      return;
    }

    logger.debug('Initializing MCP server generator...', LogCategory.GENERATOR);

    // Get template system (should be already initialized by this point)
    const templateSystem = getTemplateSystem();

    // Make sure the template system has the helpers it needs
    templateSystem.registerHelper('isRequestType', (type: string) => type.endsWith('Request'));
    templateSystem.registerHelper('isResponseType', (type: string) => type.endsWith('Result') || type.endsWith('Response'));
    templateSystem.registerHelper('getResponseTypeForRequest', (requestType: string) => requestType.replace('Request', 'Result'));
    templateSystem.registerHelper('getMethodFromRequest', (requestType: string) => {
      const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
      return methodParts.map(part => part.toLowerCase()).join('_');
    });

    await templateSystem.initialize();
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

      // Get template system
      const templateSystem = getTemplateSystem();

      // Render and write the file
      const typesPath = path.join(options.outputDir, 'types.ts');
      await templateSystem.renderToFile('types.ejs', typesPath, templateData);

      logger.success(`Generated types file: ${path.basename(typesPath)}`, LogCategory.GENERATOR);
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

      // Get template system
      const templateSystem = getTemplateSystem();

      // Generate a handler file for each resource
      for (const resource of mappedService.resources) {
        await performance.track(`generate-handler-${resource.name.toLowerCase()}`, async () => {
          logger.info(`Generating handler for resource: ${resource.name}`, LogCategory.GENERATOR);

          // Prepare template data
          const templateData = {
            resource,
            service: mappedService,
            date: new Date().toISOString(),
            version: '0.1.0'
          };

          // Render and write the file
          const handlerPath = path.join(handlersDir, `${resource.name.toLowerCase()}.ts`);
          await templateSystem.renderToFile('handler.ejs', handlerPath, templateData);

          logger.success(`Generated handler file: ${path.basename(handlerPath)}`, LogCategory.GENERATOR);
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

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Get template system
      const templateSystem = getTemplateSystem();

      // Render and write the file
      const serverPath = path.join(options.outputDir, 'server.ts');
      await templateSystem.renderToFile('server.ejs', serverPath, templateData);

      logger.success(`Generated server file: ${path.basename(serverPath)}`, LogCategory.GENERATOR);

      // Generate utility files
      await this.generateUtilFiles(options);
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

      // Get template system
      const templateSystem = getTemplateSystem();

      // Prepare template data
      const templateData = {
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Try to generate logger utility
      try {
        const loggerPath = path.join(utilsDir, 'logger.ts');
        await templateSystem.renderToFile('utils/logger.ts.ejs', loggerPath, templateData);
        logger.success('Generated logger utility', LogCategory.GENERATOR);
      } catch (error) {
        // Continue even if this fails
        logger.warn(`Optional logger utility not generated: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
      }

      // Try to generate error handler utility
      try {
        const errorHandlerPath = path.join(utilsDir, 'errorHandler.ts');
        await templateSystem.renderToFile('utils/errorHandler.ts.ejs', errorHandlerPath, templateData);
        logger.success('Generated error handler utility', LogCategory.GENERATOR);
      } catch (error) {
        // Continue even if this fails
        logger.warn(`Optional error handler utility not generated: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
      }
    });
  }

  /**
   * Generates the index file.
   */
  private async generateIndexFile(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-index-file', async () => {
      logger.info('Generating index file...', LogCategory.GENERATOR);

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Get template system
      const templateSystem = getTemplateSystem();

      // Render and write the file
      const indexPath = path.join(options.outputDir, 'index.ts');
      await templateSystem.renderToFile('index.ejs', indexPath, templateData);

      logger.success(`Generated index file: ${path.basename(indexPath)}`, LogCategory.GENERATOR);
    });
  }

  /**
   * Generates project files (package.json, tsconfig.json, etc.)
   */
  private async generateProjectFiles(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-project-files', async () => {
      logger.info('Generating project files...', LogCategory.GENERATOR);

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0',
        config: {
          projectName: mappedService.name.toLowerCase(),
          author: process.env.USER || 'MCP Generator User',
          version: '0.1.0',
          description: `MCP server for ${mappedService.name}`,
          license: 'MIT'
        }
      };

      // Get template system
      const templateSystem = getTemplateSystem();

      try {
        // Generate package.json
        const packageJsonPath = path.join(options.outputDir, 'package.json');
        await templateSystem.renderToFile('package.json.ejs', packageJsonPath, templateData);
        logger.success('Generated package.json', LogCategory.GENERATOR);
      } catch (error) {
        logger.warn(`Failed to generate package.json: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
      }

      try {
        // Generate tsconfig.json
        const tsconfigPath = path.join(options.outputDir, 'tsconfig.json');
        await templateSystem.renderToFile('tsconfig.json.ejs', tsconfigPath, templateData);
        logger.success('Generated tsconfig.json', LogCategory.GENERATOR);
      } catch (error) {
        logger.warn(`Failed to generate tsconfig.json: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
      }

      try {
        // Generate README.md
        const readmePath = path.join(options.outputDir, 'README.md');
        await templateSystem.renderToFile('README.md.ejs', readmePath, templateData);
        logger.success('Generated README.md', LogCategory.GENERATOR);
      } catch (error) {
        logger.warn(`Failed to generate README.md: ${error instanceof Error ? error.message : String(error)}`, LogCategory.GENERATOR);
      }
    });
  }

  /**
   * Generates API documentation.
   */
  private async generateDocumentation(mappedService: MappedService, options: GeneratorOptions): Promise<void> {
    return performance.track('generate-documentation', async () => {
      logger.info('Generating API documentation...', LogCategory.GENERATOR);

      // Create docs directory
      const docsDir = path.join(options.outputDir, 'docs');
      await ValidationUtils.validateDirectory(docsDir, 1009, undefined, true);

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Get template system
      const templateSystem = getTemplateSystem();

      // Render and write the file
      const apiDocPath = path.join(docsDir, 'api.md');
      await templateSystem.renderToFile('api.ejs', apiDocPath, templateData);

      logger.success(`Generated API documentation: ${path.relative(options.outputDir, apiDocPath)}`, LogCategory.GENERATOR);
    });
  }
}

// Export the singleton instance
export const mcpServerGenerator = McpServerGenerator.getInstance();