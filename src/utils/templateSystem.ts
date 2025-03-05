// Path: src/utils/templateSystem.ts
// Main entry point for the template system

import { ok, err } from 'neverthrow';
import { TemplateResolver } from './templates/templateResolver';
import { TemplateLoader } from './templates/templateLoader';
import { TemplateRenderer } from './templates/templateRenderer';
import { Template, TemplateSystemOptions, TemplateResult } from './templates/templateTypes';
import { TemplateError, TemplateNotFoundError } from './templates/templateError';
import { logger, LogCategory } from './logger';

/**
 * Template system for handling template loading, rendering, and file operations
 */
export class TemplateSystem {
  private resolver: TemplateResolver;
  private loader: TemplateLoader;
  private renderer: TemplateRenderer;
  private cachingEnabled: boolean;
  
  /**
   * Creates a new template system
   */
  constructor(options: TemplateSystemOptions) {
    const { baseDir, cache = true, verbose = false, helpers = {} } = options;
    
    this.cachingEnabled = cache;
    this.resolver = new TemplateResolver(baseDir);
    this.loader = new TemplateLoader(this.resolver, cache);
    this.renderer = new TemplateRenderer(baseDir, { cache, verbose });
    
    // Register helpers
    Object.entries(helpers).forEach(([name, fn]) => {
      this.renderer.registerHelper(name, fn);
    });
    
    logger.debug(`Template system created with base directory: ${baseDir}`, LogCategory.TEMPLATE);
  }
  
  /**
   * Renders a template with data
   */
  public render(templateName: string, data: Record<string, any>): TemplateResult<string> {
    return this.loader.loadTemplate(templateName).andThen(template => {
      return this.renderer.render(template, data);
    });
  }
  
  /**
   * Renders a template to a file
   */
  public renderToFile(
    templateName: string, 
    outputPath: string, 
    data: Record<string, any>
  ): TemplateResult<void> {
    return this.render(templateName, data).andThen(content => {
      return this.renderer.writeToFile(content, outputPath);
    });
  }
  
  /**
   * Registers a helper function
   */
  public registerHelper(name: string, fn: Function): void {
    this.renderer.registerHelper(name, fn);
    logger.debug(`Registered helper function: ${name}`, LogCategory.TEMPLATE);
  }
  
  /**
   * Lists all templates in a directory
   */
  public listTemplates(directory: string = ''): TemplateResult<string[]> {
    return this.loader.listTemplates(directory);
  }
  
  /**
   * Preloads templates for faster rendering
   */
  public preloadTemplates(directory: string = ''): TemplateResult<number> {
    return this.listTemplates(directory).andThen(templates => {
      let loadedCount = 0;
      
      // Try to load each template
      for (const template of templates) {
        const fullTemplateName = directory ? `${directory}/${template}` : template;
        const loadResult = this.loader.loadTemplate(fullTemplateName);
        
        if (loadResult.isOk()) {
          loadedCount++;
        } else {
          logger.warn(`Failed to preload template: ${fullTemplateName}`, LogCategory.TEMPLATE);
        }
      }
      
      logger.debug(`Preloaded ${loadedCount} templates`, LogCategory.TEMPLATE);
      return ok(loadedCount);
    });
  }
  
  /**
   * Clears the template cache
   */
  public clearCache(): void {
    this.loader.clearCache();
    logger.debug('Template cache cleared', LogCategory.TEMPLATE);
  }
  
  /**
   * Updates renderer configuration
   */
  public configure(options: { verbose?: boolean; cache?: boolean }): void {
    if (options.cache !== undefined && options.cache !== this.cachingEnabled) {
      this.cachingEnabled = options.cache;
    }
    
    this.renderer.configure(options);
    logger.debug('Template system configuration updated', LogCategory.TEMPLATE);
  }
}