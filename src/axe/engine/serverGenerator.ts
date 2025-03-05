// Path: src/generator/axeServerGenerator.ts
// Main generator that coordinates specialized generators to create a complete MCP server.

import { MappedService, GeneratorOptions } from "@axe/schema/types";
import { logger, LogCategory } from "@utils/logger";
import { createGeneratorError } from "@utils/errorUtils";
import { ValidationUtils } from "@utils/validationUtils";
import { performance } from "@utils/performanceUtils";
import { createAsyncErrorBoundary } from "@utils/errorBoundary";
import { 
  TypesGenerator, 
  HandlerGenerator, 
  ServerGenerator, 
  IndexGenerator, 
  ProjectFilesGenerator, 
  DocumentationGenerator 
} from './generators';

/**
 * MCP Server Generator.
 * Coordinates specialized generators to produce a complete MCP server.
 */
class AxeServerGenerator {
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
export const axeServerGenerator = AxeServerGenerator.getInstance();