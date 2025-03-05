// src/generator/generators/baseGenerator.ts
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