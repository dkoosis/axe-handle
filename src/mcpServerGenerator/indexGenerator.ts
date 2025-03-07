// Path: src/mcpServerGenerator/indexGenerator.ts
import { BaseGenerator } from '@generators/express/baseGenerator';
import { MappedService, GeneratorOptions } from '@axe/schema/types';
import { logger, LogCategory } from '@utils/logger';
import { performance } from '@utils/performanceUtils';
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