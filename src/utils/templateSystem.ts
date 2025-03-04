// src/utils/templateSystem.ts

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
// Use a direct import for better TypeScript support
import * as eta from 'eta';
import { createGeneratorError } from './errorUtils';
import { logger, LogCategory } from './logger';

export interface TemplateOptions {
  /** Base directory for templates */
  baseDir: string;
  /** Framework-specific subdirectory (optional) */
  framework?: string;
  /** Whether to cache templates */
  cache?: boolean;
  /** Custom helper functions */
  helpers?: Record<string, Function>;
}

/**
 * Unified template system for code generation
 */
export class TemplateSystem {
  private static instance: TemplateSystem;
  private baseDir: string;
  private framework?: string;
  private cache: boolean;
  private initialized: boolean = false;
  // Create a local helpers object
  private helpers: Record<string, Function> = {};
  
  private constructor(options: TemplateOptions) {
    this.baseDir = options.baseDir;
    this.framework = options.framework;
    this.cache = options.cache ?? true;
    
    // Configure Eta
    eta.configure({
      useWith: false,
      cache: this.cache,
      views: this.baseDir,
      autoEscape: false,
      debug: false
    });
    
    // Register helpers
    if (options.helpers) {
      for (const [name, fn] of Object.entries(options.helpers)) {
        this.registerHelper(name, fn);
      }
    }
    
    logger.debug(`Template system initialized with base directory: ${this.baseDir}`, LogCategory.TEMPLATE);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(options?: TemplateOptions): TemplateSystem {
    if (!TemplateSystem.instance && options) {
      TemplateSystem.instance = new TemplateSystem(options);
    } else if (!TemplateSystem.instance) {
      throw new Error('Template system not initialized');
    } else if (options) {
      // Update existing instance
      TemplateSystem.instance.updateConfig(options);
    }
    
    return TemplateSystem.instance;
  }
  
  /**
   * Update configuration
   */
  public updateConfig(options: Partial<TemplateOptions>): void {
    if (options.baseDir) {
      this.baseDir = options.baseDir;
      eta.configure({ views: this.baseDir });
    }
    if (options.framework !== undefined) {
      this.framework = options.framework;
    }
    if (options.cache !== undefined) {
      this.cache = options.cache;
      eta.configure({ cache: this.cache });
    }
    if (options.helpers) {
      for (const [name, fn] of Object.entries(options.helpers)) {
        this.registerHelper(name, fn);
      }
    }
  }

  /**
   * Initialize the template system by loading templates
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      logger.debug('Initializing template system...', LogCategory.TEMPLATE);
      
      // Check if base directory exists
      await fsPromises.access(this.baseDir);
      
      // If using a framework, check if that directory exists
      if (this.framework) {
        const frameworkDir = path.join(this.baseDir, this.framework);
        await fsPromises.access(frameworkDir);
      }
      
      this.initialized = true;
      logger.debug('Template system initialized successfully', LogCategory.TEMPLATE);
    } catch (error) {
      throw createGeneratorError(
        3001,
        `Failed to initialize template system`,
        { baseDir: this.baseDir, framework: this.framework },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Resolve a template path
   */
  public resolveTemplatePath(templateName: string): string {
    // Check if template already has the correct extension
    const hasEtaExtension = templateName.endsWith('.eta');
    const hasEjsExtension = templateName.endsWith('.ejs');
    
    // Create template name with correct extension
    let templateNameWithExt = templateName;
    if (!hasEtaExtension && !hasEjsExtension) {
      // During migration, try both extensions with preference for .eta
      templateNameWithExt = `${templateName}.eta`;
    }
    
    // Try framework-specific path first if framework is specified
    if (this.framework) {
      // First try direct path
      const frameworkPath = path.join(this.baseDir, this.framework, templateNameWithExt);
      if (fs.existsSync(frameworkPath)) {
        return frameworkPath;
      }
      
      // If that fails, try looking in a category subdirectory
      // This handles paths like "handler.eta" -> "express/handler/handler.eta"
      const templateBaseName = path.basename(templateNameWithExt, path.extname(templateNameWithExt));
      const categoryPath = path.join(this.baseDir, this.framework, templateBaseName, templateNameWithExt);
      if (fs.existsSync(categoryPath)) {
        return categoryPath;
      }
      
      // If that fails, check if we have directories named after categories that contain templates
      // This handles paths like "server/server.eta" -> "express/server/server.eta"
      const parts = templateName.split('/');
      if (parts.length > 1) {
        const category = parts[0];
        const name = parts[parts.length - 1];
        const nameWithExt = name.endsWith('.eta') || name.endsWith('.ejs') ? name : `${name}.eta`;
        
        const categoryWithNamePath = path.join(this.baseDir, this.framework, category, nameWithExt);
        if (fs.existsSync(categoryWithNamePath)) {
          return categoryWithNamePath;
        }
      }
      
      // During migration, try with .ejs extension as fallback
      if (hasEtaExtension) {
        const ejsPath = path.join(this.baseDir, this.framework, templateName.replace('.eta', '.ejs'));
        if (fs.existsSync(ejsPath)) {
          logger.debug(`Found template with .ejs extension: ${ejsPath}`, LogCategory.TEMPLATE);
          return ejsPath;
        }
      }
    }
    
    // Fallback to base path
    const basePath = path.join(this.baseDir, templateNameWithExt);
    if (fs.existsSync(basePath)) {
      return basePath;
    }
    
    // During migration, try with .ejs extension as fallback
    if (hasEtaExtension) {
      const ejsPath = path.join(this.baseDir, templateName.replace('.eta', '.ejs'));
      if (fs.existsSync(ejsPath)) {
        logger.debug(`Found template with .ejs extension: ${ejsPath}`, LogCategory.TEMPLATE);
        return ejsPath;
      }
    }
    
    // If no file was found, return the most likely path so we get a clear error
    return path.join(this.baseDir, templateNameWithExt);
  }
  
  /**
   * Render a template with data
   */
  public async render(templateName: string, data: any): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const templatePath = this.resolveTemplatePath(templateName);
      
      // Check if template exists
      await fsPromises.access(templatePath);
      
      // Log the template path for debugging
      logger.debug(`Rendering template: ${templatePath}`, LogCategory.TEMPLATE);
      
      // Merge our helper functions with the template data
      const templateData = {
        ...data,
        ...this.helpers
      };
      
      // Use Eta's file rendering
      const result = await eta.renderFileAsync(templatePath, templateData, {
        cache: this.cache,
        views: this.baseDir
      });
      
      if (result === undefined) {
        throw new Error(`Template rendering returned undefined: ${templatePath}`);
      }
      
      return result;
    } catch (error) {
      throw createGeneratorError(
        3002,
        `Failed to render template: ${templateName}`,
        { templateName },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Render a template to a file
   */
  public async renderToFile(templateName: string, outputPath: string, data: any): Promise<void> {
    try {
      const content = await this.render(templateName, data);
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      await fsPromises.mkdir(dir, { recursive: true });
      
      // Write the file
      await fsPromises.writeFile(outputPath, content, 'utf-8');
      
      logger.debug(`Rendered template ${templateName} to ${outputPath}`, LogCategory.TEMPLATE);
    } catch (error) {
      throw createGeneratorError(
        3003,
        `Failed to render template to file: ${outputPath}`,
        { templateName, outputPath },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Register a helper function
   */
  public registerHelper(name: string, fn: Function): void {
    // Store the helper in our local collection
    this.helpers[name] = fn;
    logger.debug(`Registered helper function: ${name}`, LogCategory.TEMPLATE);
  }
  
  /**
   * Clear the template cache
   */
  public clearCache(): void {
    // Clear Eta's template cache
    eta.configure({
      cache: false
    });
    
    // Re-enable caching if it was enabled
    if (this.cache) {
      eta.configure({
        cache: true
      });
    }
    
    logger.debug('Template cache cleared', LogCategory.TEMPLATE);
  }
  
  /**
   * List available templates in a directory
   */
  public async listTemplates(directory: string = ''): Promise<string[]> {
    try {
      const dir = path.join(this.baseDir, directory);
      const files = await fsPromises.readdir(dir);
      return files.filter(file => file.endsWith('.eta') || file.endsWith('.ejs'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Find templates matching a pattern
   */
  public async findTemplates(pattern: RegExp, directory: string = ''): Promise<string[]> {
    try {
      const templates = await this.listTemplates(directory);
      return templates.filter(template => pattern.test(template));
    } catch (error) {
      return [];
    }
  }
}

// Factory function to get or create template system
export function getTemplateSystem(options?: TemplateOptions): TemplateSystem {
  return TemplateSystem.getInstance(options);
}