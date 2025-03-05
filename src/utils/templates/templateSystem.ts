// Path: src/utils/templates/templateSystem.ts
// Main entry point for the template system

import * as path from 'path';
import { ok } from 'neverthrow';
import { TemplateResolver } from '@templates/templateResolver';
import { TemplateLoader } from '@templates/templateLoader';
import { TemplateRenderer } from '@templates/templateRenderer';
import { TemplateSystemOptions, TemplateResult } from '@templates/templateTypes';
import { logger, LogCategory } from './logger';

/**
 * Template system singleton instance
 */
let templateSystemInstance: TemplateSystem | null = null;

/**
 * Get or create the template system singleton
 * @param options Options for the template system
 * @returns Template system instance
 */
export function getTemplateSystem(options?: TemplateSystemOptions): TemplateSystem {
  if (!templateSystemInstance || options) {
    templateSystemInstance = new TemplateSystem(options || {
      baseDir: path.resolve(__dirname, '../../templates')
    });
  }
  return templateSystemInstance;
}

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
   * @param options Configuration options
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
   * @param templateName Template name/path
   * @param data Data for template rendering
   * @returns Result with rendered content or error
   */
  public render(templateName: string, data: Record<string, any>): TemplateResult<string> {
    return this.loader.loadTemplate(templateName).andThen(template => {
      return this.renderer.renderTemplate(template, data);
    });
  }
  
  /**
   * Renders a template to a file
   * @param templateName Template name/path
   * @param outputPath Output file path
   * @param data Data for template rendering
   * @returns Result with void on success or error
   */
  public renderToFile(
    templateName: string, 
    outputPath: string, 
    data: Record<string, any>
  ): TemplateResult<void> {
    return this.render(templateName, data).andThen(content => {
      return this.renderer.writeToFile(content, outputPath, templateName);
    });
  }
  
  /**
   * Registers a helper function
   * @param name Helper function name
   * @param fn Helper function
   */
  public registerHelper(name: string, fn: Function): void {
    this.renderer.registerHelper(name, fn);
    logger.debug(`Registered helper function: ${name}`, LogCategory.TEMPLATE);
  }
  
  /**
   * Lists all templates in a directory
   * @param directory Directory path relative to baseDir
   * @returns Result with template names or error
   */
  public listTemplates(directory: string = ''): TemplateResult<string[]> {
    return this.loader.listTemplates(directory, this.resolver.baseDir);
  }
  
  /**
   * Preloads templates for faster rendering
   * @param directory Directory to preload from
   * @returns Result with number of templates loaded or error
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
   * Updates configuration options
   * @param options New configuration options
   */
  public updateConfig(options: { verbose?: boolean; cache?: boolean }): void {
    if (options.cache !== undefined && options.cache !== this.cachingEnabled) {
      this.cachingEnabled = options.cache;
    }
    
    this.renderer.updateConfig(options);
    logger.debug('Template system configuration updated', LogCategory.TEMPLATE);
  }
}