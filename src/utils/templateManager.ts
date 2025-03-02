// Path: src/utils/templateManager.ts
// Provides a centralized template management system for the Axe Handle code generator.

import * as fs from 'fs/promises';
import * as path from 'path';
import * as ejs from 'ejs';
import { createGeneratorError } from './errorUtils';

/**
 * Available template frameworks.
 */
export type TemplateFramework = 'express' | 'nestjs' | 'fastify';

/**
 * Template categories.
 */
export enum TemplateCategory {
  SERVER = 'server',
  HANDLER = 'handler',
  TYPES = 'types',
  INDEX = 'index',
  API = 'api',
  CONFIG = 'config'
}

/**
 * Template path resolution options.
 */
export interface TemplatePathOptions {
  framework: TemplateFramework;
  category: TemplateCategory;
  name: string;
}

/**
 * Template Manager.
 * Responsible for managing templates, validating their existence,
 * and providing a unified interface for rendering templates.
 */
export class TemplateManager {
  private static instance: TemplateManager;

  private templatesDir: string;
  private templateCache: Map<string, string> = new Map();
  
  /**
   * Creates a new TemplateManager.
   * @param templatesDir Directory containing templates
   */
  private constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
  }
  
  /**
   * Gets the singleton instance of the TemplateManager.
   * @param templatesDir Directory containing templates (optional, only used on first call)
   * @returns The TemplateManager instance
   */
  public static getInstance(templatesDir?: string): TemplateManager {
    if (!TemplateManager.instance) {
      if (!templatesDir) {
        throw new Error('templatesDir must be provided when creating the TemplateManager instance');
      }
      TemplateManager.instance = new TemplateManager(templatesDir);
    }
    return TemplateManager.instance;
  }
  
  /**
   * Gets the path to a template.
   * @param options Template path options
   * @returns The path to the template
   */
  public getTemplatePath(options: TemplatePathOptions): string {
    const { framework, category, name } = options;
    
    // Build framework-specific path if specified
    if (framework) {
      return path.join(this.templatesDir, framework, `${category}/${name}.ejs`);
    }
    
    // Build generic path
    return path.join(this.templatesDir, `${category}/${name}.ejs`);
  }
  
  /**
   * Validates that a template exists.
   * @param templatePath Path to the template
   * @returns Promise that resolves when the template is validated
   * @throws Error if the template does not exist
   */
  public async validateTemplate(templatePath: string): Promise<void> {
    try {
      await fs.access(templatePath);
    } catch (error) {
      throw createGeneratorError(
        2001,
        `Template not found: ${templatePath}`,
        { templatePath },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Loads a template from the file system or cache.
   * @param templatePath Path to the template
   * @returns The template content
   */
  public async loadTemplate(templatePath: string): Promise<string> {
    // Check if the template is in the cache
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }
    
    // Validate that the template exists
    await this.validateTemplate(templatePath);
    
    // Load the template
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    // Cache the template
    this.templateCache.set(templatePath, templateContent);
    
    return templateContent;
  }
  
  /**
   * Renders a template with the given data.
   * @param templatePath Path to the template
   * @param data Data to render the template with
   * @returns The rendered template
   */
  public async renderTemplate(templatePath: string, data: any): Promise<string> {
    try {
      // Load the template
      const templateContent = await this.loadTemplate(templatePath);
      
      // Render the template
      return await ejs.render(templateContent, data, { async: true });
    } catch (error) {
      throw createGeneratorError(
        2002,
        `Failed to render template: ${templatePath}`,
        { templatePath },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Renders a template and writes it to a file.
   * @param templatePath Path to the template
   * @param outputPath Path to output the rendered template
   * @param data Data to render the template with
   */
  public async renderToFile(templatePath: string, outputPath: string, data: any): Promise<void> {
    try {
      // Create the directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Render the template
      const renderedContent = await this.renderTemplate(templatePath, data);
      
      // Write the rendered content to the file
      await fs.writeFile(outputPath, renderedContent, 'utf-8');
    } catch (error) {
      throw createGeneratorError(
        2003,
        `Failed to render template to file: ${outputPath}`,
        { templatePath, outputPath },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Clears the template cache.
   */
  public clearCache(): void {
    this.templateCache.clear();
  }
  
  /**
   * Gets a list of available templates for a given framework and category.
   * @param framework The framework to get templates for
   * @param category The category to get templates for
   * @returns A list of template names
   */
  public async getAvailableTemplates(framework: TemplateFramework, category: TemplateCategory): Promise<string[]> {
    try {
      const templatesDir = path.join(this.templatesDir, framework, category);
      
      // Check if the directory exists
      try {
        await fs.access(templatesDir);
      } catch (error) {
        return []; // Directory doesn't exist, no templates available
      }
      
      // Get all files in the directory
      const files = await fs.readdir(templatesDir);
      
      // Filter out files that don't end with .ejs
      return files
        .filter(file => file.endsWith('.ejs'))
        .map(file => file.replace('.ejs', ''));
    } catch (error) {
      throw createGeneratorError(
        2004,
        `Failed to get available templates`,
        { framework, category },
        error instanceof Error ? error : undefined
      );
    }
  }
}

// Export a function to get the singleton instance
export function getTemplateManager(templatesDir?: string): TemplateManager {
  return TemplateManager.getInstance(templatesDir);
}
