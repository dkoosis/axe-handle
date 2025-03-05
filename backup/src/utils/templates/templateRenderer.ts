// Path: src/utils/templates/templateRenderer.ts
// Handles rendering of templates

import * as fs from 'fs';
import * as path from 'path';
import * as eta from 'eta';
import { ok, err } from 'neverthrow';
import { logger, LogCategory } from '../logger';
import { Template, TemplateResult } from './templateTypes';
import { TemplateRenderError, TemplateWriteError } from './templateError';

/**
 * Handles rendering of templates
 */
export class TemplateRenderer {
  private baseDir: string;
  private cache: boolean;
  private verbose: boolean;
  private helpers: Record<string, Function> = {};

  /**
   * Creates a new template renderer
   * @param baseDir Base directory for templates
   * @param options Options for the renderer
   */
  constructor(
    baseDir: string, 
    options: { cache?: boolean; verbose?: boolean; } = {}
  ) {
    this.baseDir = baseDir;
    this.cache = options.cache ?? true;
    this.verbose = options.verbose ?? false;
    
    // Configure Eta
    eta.configure({
      useWith: false,
      cache: this.cache,
      views: this.baseDir,
      autoEscape: false,
      debug: this.verbose
    });
  }

  /**
   * Registers a helper function
   * @param name Helper function name
   * @param fn Helper function
   */
  public registerHelper(name: string, fn: Function): void {
    this.helpers[name] = fn;
    logger.debug(`Registered helper function: ${name}`, LogCategory.TEMPLATE);
  }

  /**
   * Updates configuration options
   * @param options New options
   */
  public updateConfig(options: { cache?: boolean; verbose?: boolean; }): void {
    if (options.cache !== undefined) {
      this.cache = options.cache;
      eta.configure({ cache: this.cache });
    }
    
    if (options.verbose !== undefined) {
      this.verbose = options.verbose;
      eta.configure({ debug: this.verbose });
    }
    
    logger.debug('Template renderer configuration updated', LogCategory.TEMPLATE);
  }

  /**
   * Renders a template with data
   * @param template The template to render
   * @param data Data to render the template with
   * @returns Result with the rendered content or an error
   */
  public renderTemplate(template: Template, data: any): TemplateResult<string> {
    logger.debug(`Rendering template: ${template.name}`, LogCategory.TEMPLATE);
    console.log("Template data:", JSON.stringify(data, null, 2)); //dk    
    try {
      // Create a context with helpers
      const context = {
        ...data,
        ...this.helpers
      };
      
      // Render the template
      const rendered = eta.render(template.content, context, {
        filename: template.absolutePath,
        root: this.baseDir,
        debug: this.verbose,
        cache: this.cache
      });
      
      if (rendered === undefined) {
        return err(
          new TemplateRenderError(template.name, {
            reason: 'Rendering returned undefined',
            templatePath: template.absolutePath
          })
        );
      }
      
      logger.debug(`Template rendered successfully: ${template.name}`, LogCategory.TEMPLATE);
      return ok(rendered);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to render template: ${errorMessage}`, LogCategory.TEMPLATE);
      
      // Analyze available data for diagnostics
      const availableDataKeys = Object.keys(data || {});
      const templatePreview = template.content.substring(0, 300) + 
        (template.content.length > 300 ? '...' : '');
      
      return err(
        new TemplateRenderError(template.name, {
          reason: errorMessage,
          templatePath: template.absolutePath,
          availableDataKeys,
          templatePreview
        }, error instanceof Error ? error : undefined)
      );
    }
  }

  /**
   * Writes content to a file
   * @param content The content to write
   * @param outputPath The file path to write to
   * @param templateName Optional template name for error reporting
   * @returns Result with void on success or an error
   */
  public writeToFile(
    content: string, 
    outputPath: string, 
    templateName?: string
  ): TemplateResult<void> {
    logger.debug(`Writing to file: ${outputPath}`, LogCategory.TEMPLATE);
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write the file
      fs.writeFileSync(outputPath, content, 'utf-8');
      
      logger.debug(`File written successfully: ${outputPath}`, LogCategory.TEMPLATE);
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to write file: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateWriteError(
          templateName || 'unknown',
          outputPath,
          {},
          error instanceof Error ? error : undefined
        )
      );
    }
  }
}