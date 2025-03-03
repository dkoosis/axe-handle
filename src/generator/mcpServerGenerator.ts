// Path: src/generator/generator.ts
// Core code generation functionality for the Axe Handle tool.

import * as fs from 'fs/promises';
import * as path from 'path';
// Removed unused ejs import
import { MappedService, GeneratorOptions } from '../types';
import { logger } from '../utils/logger';
import { createGeneratorError } from '../utils/errorUtils';
import TemplateEngine from '../utils/templateEngine';

/**
 * Code Generator.
 * Handles the generation of server code for MCP-compliant applications.
 */
class Generator {
  private static instance: Generator;
  private templatesDir: string;
  private templateEngine: TemplateEngine;

  /**
   * Creates a new Generator instance.
   * Private to enforce singleton pattern.
   */
  private constructor() {
    // Use the proper path resolution to find the templates directory
    this.templatesDir = path.resolve(__dirname, '../../templates');
    logger.debug(`Generator initialized with templates directory: ${this.templatesDir}`);
    
    // Initialize the template engine
    this.templateEngine = new TemplateEngine(this.templatesDir);
  }

  /**
   * Gets the singleton instance of the Generator.
   * @returns The Generator instance
   */
  public static getInstance(): Generator {
    if (!Generator.instance) {
      Generator.instance = new Generator();
    }
    return Generator.instance;
  }

  /**
   * Generates server code for the mapped service.
   * @param mappedService The mapped service
   * @param options Generator options
   * @throws Error if generation fails
   */
  public async generateServer(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.section('Code Generation');
      logger.info(`Generating code for service: ${mappedService.name}`);

      // Validate templates directory
      await this.validateTemplatesDirectory(options.verbose);

      // Initialize the template engine
      this.templateEngine.loadTemplates();

      // Create output directory if it doesn't exist
      await fs.mkdir(options.outputDir, { recursive: true });

      // Generate files
      await this.generateTypesFile(mappedService, options);
      await this.generateHandlerFiles(mappedService, options);
      await this.generateServerFile(mappedService, options);
      await this.generateIndexFile(mappedService, options);

      // Generate documentation (if enabled)
      if (options.generateDocs) {
        await this.generateDocumentation(mappedService, options);
      }

      logger.success(`Code generation completed for service: ${mappedService.name}`);
    } catch (error) {
      logger.error(`Error generating server code: ${error instanceof Error ? error.message : String(error)}`);
      
      // Rethrow AxeError, or wrap other errors
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createGeneratorError(
        1,
        'Failed to generate server code',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Validates that the templates directory exists and is accessible.
   * @param verbose Whether to log verbose information
   * @throws Error if templates directory doesn't exist
   */
  private async validateTemplatesDirectory(verbose: boolean = false): Promise<void> {
    try {
      await fs.access(this.templatesDir);
      logger.debug(`Templates directory exists: ${this.templatesDir}`);

      // List directory contents only in verbose mode
      if (verbose) {
        const templateFiles = await fs.readdir(this.templatesDir);
        logger.debug(`Template directory contents: ${templateFiles.join(', ')}`);
      }
    } catch (error) {
      logger.error(`Templates directory not found: ${this.templatesDir}`);
      throw createGeneratorError(
        1001,
        `Templates directory not found: ${this.templatesDir}`,
        { templatesDir: this.templatesDir },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generates the types file.
   * @param mappedService The mapped service
   * @param options Generator options
   * @throws Error if types file generation fails
   */
  private async generateTypesFile(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.info('Generating types file...');

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Render the template
      const typesContent = this.templateEngine.renderTemplate('types.ejs', templateData);

      // Write types file
      const typesPath = path.join(options.outputDir, 'types.ts');
      await fs.writeFile(typesPath, typesContent, 'utf-8');

      logger.success(`Generated types file: ${path.basename(typesPath)}`);
    } catch (error) {
      logger.error(`Error generating types file: ${error instanceof Error ? error.message : String(error)}`);
      throw createGeneratorError(
        1002,
        'Failed to generate types file',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generates handler files for each resource in the service.
   * @param mappedService The mapped service
   * @param options Generator options
   * @throws Error if handler files generation fails
   */
  private async generateHandlerFiles(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.info('Generating handler files...');

      // Create handlers directory
      const handlersDir = path.join(options.outputDir, 'handlers');
      await fs.mkdir(handlersDir, { recursive: true });

      // Generate a handler file for each resource
      for (const resource of mappedService.resources) {
        logger.info(`Generating handler for resource: ${resource.name}`);

        // Prepare template data
        const templateData = {
          resource,
          service: mappedService,
          date: new Date().toISOString(),
          version: '0.1.0'
        };

        // Render the handler template
        const handlerContent = this.templateEngine.renderTemplate('handler.ejs', templateData);

        // Write handler file
        const handlerPath = path.join(handlersDir, `${resource.name.toLowerCase()}.ts`);
        await fs.writeFile(handlerPath, handlerContent, 'utf-8');

        logger.success(`Generated handler file: ${path.basename(handlerPath)}`);
      }
    } catch (error) {
      logger.error(`Error generating handler files: ${error instanceof Error ? error.message : String(error)}`);
      throw createGeneratorError(
        1003,
        'Failed to generate handler files',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generates the server file.
   * @param mappedService The mapped service
   * @param options Generator options
   * @throws Error if server file generation fails
   */
  private async generateServerFile(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.info('Generating server file...');

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Render the server template
      const serverContent = this.templateEngine.renderTemplate('server.ejs', templateData);

      // Write server file
      const serverPath = path.join(options.outputDir, 'server.ts');
      await fs.writeFile(serverPath, serverContent, 'utf-8');

      logger.success(`Generated server file: ${path.basename(serverPath)}`);

      // Generate utility files if needed
      await this.generateUtilFiles(options);
    } catch (error) {
      logger.error(`Error generating server file: ${error instanceof Error ? error.message : String(error)}`);
      throw createGeneratorError(
        1004,
        'Failed to generate server file',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generates utility files (logger, error handler, etc.)
   * @param options Generator options
   */
  private async generateUtilFiles(options: GeneratorOptions): Promise<void> {
    try {
      logger.info('Generating utility files...');

      // Create utils directory
      const utilsDir = path.join(options.outputDir, 'utils');
      await fs.mkdir(utilsDir, { recursive: true });

      // Prepare template data
      const templateData = {
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Generate logger utility
      try {
        const loggerContent = this.templateEngine.renderTemplate('utils/logger.ts.ejs', templateData);
        await fs.writeFile(path.join(utilsDir, 'logger.ts'), loggerContent, 'utf-8');
        logger.success('Generated logger utility');
      } catch (error) {
        // Continue even if this fails - log but don't throw
        logger.warn(`Failed to generate logger utility: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Generate error handler utility
      try {
        const errorHandlerContent = this.templateEngine.renderTemplate('utils/errorHandler.ts.ejs', templateData);
        await fs.writeFile(path.join(utilsDir, 'errorHandler.ts'), errorHandlerContent, 'utf-8');
        logger.success('Generated error handler utility');
      } catch (error) {
        // Continue even if this fails - log but don't throw
        logger.warn(`Failed to generate error handler utility: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      // Utility files are optional, so just log a warning
      logger.warn(`Error generating utility files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generates the index file.
   * @param mappedService The mapped service
   * @param options Generator options
   * @throws Error if index file generation fails
   */
  private async generateIndexFile(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.info('Generating index file...');

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Render the index template
      const indexContent = this.templateEngine.renderTemplate('index.ejs', templateData);

      // Write index file
      const indexPath = path.join(options.outputDir, 'index.ts');
      await fs.writeFile(indexPath, indexContent, 'utf-8');

      logger.success(`Generated index file: ${path.basename(indexPath)}`);
    } catch (error) {
      logger.error(`Error generating index file: ${error instanceof Error ? error.message : String(error)}`);
      throw createGeneratorError(
        1005,
        'Failed to generate index file',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Generates API documentation.
   * @param mappedService The mapped service
   * @param options Generator options
   * @throws Error if documentation generation fails
   */
  private async generateDocumentation(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.info('Generating API documentation...');

      // Create docs directory
      const docsDir = path.join(options.outputDir, 'docs');
      await fs.mkdir(docsDir, { recursive: true });

      // Prepare template data
      const templateData = {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      };

      // Render the API documentation template
      const apiDocContent = this.templateEngine.renderTemplate('api.ejs', templateData);

      // Write API documentation file
      const apiDocPath = path.join(docsDir, 'api.md');
      await fs.writeFile(apiDocPath, apiDocContent, 'utf-8');

      logger.success(`Generated API documentation: ${path.relative(options.outputDir, apiDocPath)}`);
    } catch (error) {
      logger.error(`Error generating documentation: ${error instanceof Error ? error.message : String(error)}`);
      throw createGeneratorError(
        1006,
        'Failed to generate documentation',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Export the singleton instance
export const generator = Generator.getInstance();
