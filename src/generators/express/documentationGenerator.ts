// src/generator/generators/documentationGenerator.ts
import { BaseGenerator } from '@generators/express/baseGenerator';
import { MappedService, GeneratorOptions } from '@axe/schema/types';
import { logger, LogCategory } from '@utils/logger';
import { performance } from '@utils/performanceUtils';
import * as path from 'path';
import { ValidationUtils } from '@utils/validationUtils';

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