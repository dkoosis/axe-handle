// src/generator/generators/typesGenerator.ts
import { BaseGenerator } from '@generators/express/baseGenerator';
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