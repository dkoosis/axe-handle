import * as fs from 'fs/promises';
import * as path from 'path';
import * as ejs from 'ejs';
import { MappedService, GeneratorOptions } from '../types';
import { logger } from '../utils/logger';
import { createGeneratorError } from '../utils/errorUtils';

/**
 * Code Generator.
 */
class Generator {
  private static instance: Generator;

  private templatesDir: string;

  private constructor() {
    this.templatesDir = path.resolve(__dirname, '../../templates');
    logger.debug(`Generator initialized with templates directory: ${this.templatesDir}`);
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
   */
  public async generateServer(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.section('Code Generation');
      logger.info(`Generating code for service: ${mappedService.name}`);

      // Check if templates directory exists
      try {
        await fs.access(this.templatesDir);
        logger.debug(`Templates directory exists: ${this.templatesDir}`);

        // List directory contents only in verbose mode
        if (options.verbose) {
          const templateFiles = await fs.readdir(this.templatesDir);
          logger.debug(`Template directory contents: ${templateFiles.join(', ')}`);
        }
      } catch (error) {
        logger.error(`Templates directory not found: ${this.templatesDir}`);
        throw createGeneratorError(
          1,
          `Templates directory not found: ${this.templatesDir}`,
          { templatesDir: this.templatesDir },
          error instanceof Error ? error : new Error(String(error))
        );
      }

      // Create output directory if it doesn't exist
      await fs.mkdir(options.outputDir, { recursive: true });

      // Generate files
      await this.generateTypesFile(mappedService, options);
      await this.generateHandlerFiles(mappedService, options);
      await this.generateServer(mappedService, options); // Corrected method name
      await this.generateIndexFile(mappedService, options);

      // Generate documentation (if enabled)
      if (options.generateDocs) {
        await this.generateDocumentation(mappedService, options);
      }

      logger.success(`Code generation completed for service: ${mappedService.name}`);
    } catch (error) {
      logger.error(`Error generating server code: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, rethrow
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
   * Generates the types file.
   * @param mappedService The mapped service
   * @param options Generator options
   */
  private async generateTypesFile(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      logger.info('Generating types file...');

      // First, look for the template in the templates directory
      let templatePath = path.join(this.templatesDir, 'types.ejs');

      // Check if the template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        // If not found, try in express/types directory
        templatePath = path.join(this.templatesDir, 'express', 'types', 'types.ejs');
        try {
          await fs.access(templatePath);
        } catch (innerError) {
          throw createGeneratorError(
            2,
            'Types template not found',
            {
              triedPaths: [
                path.join(this.templatesDir, 'types.ejs'),
                path.join(this.templatesDir, 'express', 'types', 'types.ejs')
              ]
            },
            innerError instanceof Error ? innerError : new Error(String(innerError))
          );
        }
      }

      // Read template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      logger.debug(`Types template loaded from: ${templatePath}`);

      // Generate types
      const typesContent = ejs.render(templateContent, {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      });

      // Write types file
      const typesPath = path.join(options.outputDir, 'types.ts');
      await fs.writeFile(typesPath, typesContent, 'utf-8');

      logger.success(`Generated types file: ${path.basename(typesPath)}`);
    } catch (error) {
      logger.error(`Error generating types file: ${error instanceof Error ? error.message : String(error)}`);
      throw createGeneratorError(
        3,
        'Failed to generate types file',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // These methods should be OUTSIDE of generateTypesFile, but INSIDE the class
  private async generateHandlerFiles(_mappedService: MappedService, _options: GeneratorOptions): Promise<void> {
    // TODO: Implement handler file generation
    logger.info('Generating handler files...');
    logger.debug(`using options`);
  }

  private async generateIndexFile(_mappedService: MappedService, _options: GeneratorOptions): Promise<void> {
    // TODO: Implement index file generation
    logger.info('Generating index file...');
    logger.debug(`using options`);
  }

  private async generateDocumentation(_mappedService: MappedService, _options: GeneratorOptions): Promise<void> {
    // TODO: Implement documentation generation
    logger.info('Generating documentation...');
    logger.debug(`using options`);
  }
}

// Export the singleton instance
export const generator = Generator.getInstance();