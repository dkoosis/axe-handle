// src/utils/templateSystem.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import * as eta from 'eta';
import { createGeneratorError } from './errorUtils';
import { logger } from './logger';

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
  private templateCache: Map<string, string> = new Map();
  private cache: boolean;
  private initialized: boolean = false;
  
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
        eta.helpers[name] = fn;
      }
    }
    
    logger.debug(`Template system initialized with base directory: ${this.baseDir}`);
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
      if (options.baseDir) {
        TemplateSystem.instance.baseDir = options.baseDir;
      }
      if (options.framework !== undefined) {
        TemplateSystem.instance.framework = options.framework;
      }
      if (options.cache !== undefined) {
        TemplateSystem.instance.cache = options.cache;
      }
      if (options.helpers) {
        for (const [name, fn] of Object.entries(options.helpers)) {
          eta.helpers[name] = fn;
        }
      }
    }
    
    return TemplateSystem.instance;
  }
  
  /**
   * Initialize the template system by loading templates
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      logger.debug('Initializing template system...');
      
      // Check if base directory exists
      await fs.access(this.baseDir);
      
      // If using a framework, check if that directory exists
      if (this.framework) {
        const frameworkDir = path.join(this.baseDir, this.framework);
        await fs.access(frameworkDir);
      }
      
      this.initialized = true;
      logger.debug('Template system initialized successfully');
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
    // Try framework-specific path first if framework is specified
    if (this.framework) {
      const frameworkPath = path.join(this.baseDir, this.framework, templateName);
      if (fs.existsSync(frameworkPath)) {
        return frameworkPath;
      }
    }
    
    // Fallback to base path
    return path.join(this.baseDir, templateName);
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
      await fs.access(templatePath);
      
      // Load the template content
      let templateContent: string;
      
      if (this.cache && this.templateCache.has(templatePath)) {
        templateContent = this.templateCache.get(templatePath)!;
      } else {
        templateContent = await fs.readFile(templatePath, 'utf-8');
        if (this.cache) {
          this.templateCache.set(templatePath, templateContent);
        }
      }
      
      // Render the template
      const result = await eta.renderAsync(templateContent, data, {
        filename: templatePath
      });
      
      return result || '';
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
      await fs.mkdir(dir, { recursive: true });
      
      // Write the file
      await fs.writeFile(outputPath, content, 'utf-8');
      
      logger.debug(`Rendered template ${templateName} to ${outputPath}`);
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
    eta.helpers[name] = fn;
    logger.debug(`Registered helper function: ${name}`);
  }
  
  /**
   * Clear the template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
    eta.cache.clear();
    logger.debug('Template cache cleared');
  }
  
  /**
   * List available templates in a directory
   */
  public async listTemplates(directory: string = ''): Promise<string[]> {
    try {
      const dir = path.join(this.baseDir, directory);
      const files = await fs.readdir(dir);
      return files.filter(file => file.endsWith('.eta') || file.endsWith('.ejs'));
    } catch (error) {
      return [];
    }
  }
}

// Factory function to get or create template system
export function getTemplateSystem(options?: TemplateOptions): TemplateSystem {
  return TemplateSystem.getInstance(options);
}