// src/generator/generators/handlerGenerator.ts
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