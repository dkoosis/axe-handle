// Path: src/utils/templates/templateLoader.ts
// Handles loading template files

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { ok, err } from 'neverthrow';
import { logger, LogCategory } from '@utils/logger';
import { Template, TemplateResult } from './templateTypes';
import { TemplateLoadError } from './templateError';
import { TemplateResolver } from './templateResolver';

/**
 * Handles loading and caching of templates
 */
export class TemplateLoader {
  private templateResolver: TemplateResolver;
  private templateCache: Map<string, Template> = new Map();
  private cache: boolean;

  /**
   * Creates a new template loader
   * @param templateResolver The template resolver to use
   * @param cache Whether to cache templates
   */
  constructor(templateResolver: TemplateResolver, cache: boolean = true) {
    this.templateResolver = templateResolver;
    this.cache = cache;
  }

  /**
   * Loads a template by name
   * @param templateName Template name
   * @returns Result with the template or an error
   */
  public loadTemplate(templateName: string): TemplateResult<Template> {
    logger.debug(`Loading template: ${templateName}`, LogCategory.TEMPLATE);
    
    // Check cache first if enabled
    if (this.cache && this.templateCache.has(templateName)) {
      const cachedTemplate = this.templateCache.get(templateName);
      if (cachedTemplate) {
        logger.debug(`Using cached template: ${templateName}`, LogCategory.TEMPLATE);
        return ok(cachedTemplate);
      }
    }
    
    // Resolve the template path
    const pathResult = this.templateResolver.resolveTemplatePath(templateName);
    if (pathResult.isErr()) {
      return err(pathResult.error);
    }
    
    const templatePath = pathResult.value;
    
    try {
      // Read the template content
      const content = fs.readFileSync(templatePath, 'utf-8');
      
      // Create template object
      const template: Template = {
        name: templateName,
        absolutePath: templatePath,
        content
      };
      
      // Cache the template if caching is enabled
      if (this.cache) {
        this.templateCache.set(templateName, template);
      }
      
      logger.debug(`Template loaded successfully: ${templateName}`, LogCategory.TEMPLATE);
      return ok(template);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to load template: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateLoadError(templateName, 
          { templatePath },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Asynchronously loads a template by name
   * @param templateName Template name
   * @returns Promise with Result containing the template or an error
   */
  public async loadTemplateAsync(templateName: string): Promise<TemplateResult<Template>> {
    logger.debug(`Loading template asynchronously: ${templateName}`, LogCategory.TEMPLATE);
    
    // Check cache first if enabled
    if (this.cache && this.templateCache.has(templateName)) {
      const cachedTemplate = this.templateCache.get(templateName);
      if (cachedTemplate) {
        logger.debug(`Using cached template: ${templateName}`, LogCategory.TEMPLATE);
        return ok(cachedTemplate);
      }
    }
    
    // Resolve the template path
    const pathResult = this.templateResolver.resolveTemplatePath(templateName);
    if (pathResult.isErr()) {
      return err(pathResult.error);
    }
    
    const templatePath = pathResult.value;
    
    try {
      // Read the template content
      const content = await fsPromises.readFile(templatePath, 'utf-8');
      
      // Create template object
      const template: Template = {
        name: templateName,
        absolutePath: templatePath,
        content
      };
      
      // Cache the template if caching is enabled
      if (this.cache) {
        this.templateCache.set(templateName, template);
      }
      
      logger.debug(`Template loaded successfully: ${templateName}`, LogCategory.TEMPLATE);
      return ok(template);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to load template: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateLoadError(templateName,
          { templatePath },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Clears the template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
    logger.debug('Template cache cleared', LogCategory.TEMPLATE);
  }

  /**
   * Lists available templates in a directory
   * @param directory Relative path from baseDir
   * @param baseDir Base directory for templates
   * @returns Result with template names or an error
   */
  public listTemplates(directory: string = '', baseDir: string): TemplateResult<string[]> {
    try {
      const dirPath = path.join(baseDir, directory);
      
      if (!fs.existsSync(dirPath)) {
        return err(
          new TemplateLoadError('directory', 
            { baseDir, directory, message: `Directory not found: ${dirPath}` }
          )
        );
      }
      
      // Read directory
      const files = fs.readdirSync(dirPath);
      
      // Filter for template files
      const templates = files.filter(file => 
        file.endsWith('.eta') || file.endsWith('.ejs')
      );
      
      return ok(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to list templates: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateLoadError('directory', 
          { baseDir, directory, message: `Failed to list templates: ${errorMessage}` },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Asynchronously lists available templates in a directory
   * @param directory Relative path from baseDir
   * @param baseDir Base directory for templates
   * @returns Promise with Result containing template names or an error
   */
  public async listTemplatesAsync(directory: string = '', baseDir: string): Promise<TemplateResult<string[]>> {
    try {
      const dirPath = path.join(baseDir, directory);
      
      try {
        await fsPromises.access(dirPath);
      } catch {
        return err(
          new TemplateLoadError('directory',
            { baseDir, directory, message: `Directory not found: ${dirPath}` }
          )
        );
      }
      
      // Read directory
      const files = await fsPromises.readdir(dirPath);
      
      // Filter for template files
      const templates = files.filter(file => 
        file.endsWith('.eta') || file.endsWith('.ejs')
      );
      
      return ok(templates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to list templates: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateLoadError('directory',
          { baseDir, directory, message: `Failed to list templates: ${errorMessage}` },
          error instanceof Error ? error : undefined
        )
      );
    }
  }
}