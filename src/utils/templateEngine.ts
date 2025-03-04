// Path: src/utils/templateEngine.ts
// Provides a template engine for generating code from Eta templates with error handling using neverthrow.

import * as fs from 'fs';
import * as path from 'path';
import * as eta from 'eta';
import { Result, ok, err } from 'neverthrow';
import { AxeError } from '../types';
import { createGeneratorError } from './errorUtils';
import { logger, LogCategory } from './logger';

/**
 * Template Engine.
 * Handles the loading and rendering of Eta templates with Result-based error handling.
 */
export default class TemplateEngine {
  private templateDir: string;
  private templates: Map<string, string> = new Map();
  private helpers: Record<string, Function> = {};
  private isVerbose: boolean = false;

  /**
   * Creates a new Template Engine.
   * @param templateDir Directory containing templates
   * @param verbose Whether to enable verbose logging
   */
  constructor(templateDir: string, verbose: boolean = false) {
    this.templateDir = templateDir;
    this.isVerbose = verbose;
    
    logger.debug(`TemplateEngine initialized with directory: ${templateDir}`, LogCategory.TEMPLATE);

    // Configure Eta
    eta.configure({
      cache: true,
      autoEscape: false,
      views: templateDir,
      useWith: true 
    });
  }

  /**
   * Loads all templates from the template directory.
   * @returns Result with void on success or AxeError on failure
   */
  public loadTemplates(): Result<void, AxeError> {
    try {
      logger.debug(`Loading templates from directory: ${this.templateDir}`, LogCategory.TEMPLATE);
      
      // Check if template directory exists
      if (!fs.existsSync(this.templateDir)) {
        logger.error(`Template directory not found: ${this.templateDir}`, LogCategory.TEMPLATE);
        return err(createGeneratorError(
          3001,
          `Template directory not found: ${this.templateDir}`,
          { templateDir: this.templateDir }
        ));
      }

      // List all files in the directory to verify access
      const dirContents = fs.readdirSync(this.templateDir);
      logger.debug(`Template directory contents: ${dirContents.join(', ')}`, LogCategory.TEMPLATE);

      // Get all templates in the directory structure - supporting both .eta and .ejs
      this.walkDir(this.templateDir, (filePath) => {
        if (filePath.endsWith('.eta') || filePath.endsWith('.ejs')) {
          const relativePath = path.relative(this.templateDir, filePath);
          try {
            const templateContent = fs.readFileSync(filePath, 'utf-8');
            this.templates.set(relativePath, templateContent);
            
            // Also store a version without the extension for easier lookup
            const baseNameWithoutExt = path.basename(relativePath, path.extname(relativePath));
            const dirName = path.dirname(relativePath);
            if (dirName === '.') {
              // Root template
              this.templates.set(baseNameWithoutExt, templateContent);
            } else {
              // Template in subdirectory
              this.templates.set(path.join(dirName, baseNameWithoutExt), templateContent);
            }
            
            logger.debug(`Loaded template: ${relativePath}`, LogCategory.TEMPLATE);
          } catch (err) {
            logger.warn(`Failed to read template file: ${filePath}, error: ${err}`, LogCategory.TEMPLATE);
          }
        }
      });

      logger.debug(`Loaded ${this.templates.size} templates`, LogCategory.TEMPLATE);
      if (this.templates.size === 0) {
        logger.warn('No templates found. This may cause errors during generation.', LogCategory.TEMPLATE);
      }
      
      return ok(undefined);
    } catch (error) {
      logger.error(`Template loading error: ${error}`, LogCategory.TEMPLATE);
      
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, return it
        return err(error as AxeError);
      }

      return err(createGeneratorError(
        3002,
        `Failed to load templates from ${this.templateDir}`,
        { templateDir: this.templateDir },
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  /**
   * Walks a directory recursively and calls the callback for each file.
   * @param dir Directory to walk
   * @param callback Callback to call for each file
   */
  private walkDir(dir: string, callback: (filePath: string) => void): void {
    try {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            this.walkDir(filePath, callback);
          } else {
            callback(filePath);
          }
        } catch (err) {
          logger.warn(`Error accessing path: ${filePath}, error: ${err}`, LogCategory.TEMPLATE);
        }
      }
    } catch (err) {
      logger.warn(`Error reading directory: ${dir}, error: ${err}`, LogCategory.TEMPLATE);
    }
  }

  /**
   * Registers a custom helper function.
   * @param name Name of the helper function
   * @param fn Helper function implementation
   */
  public registerHelper(name: string, fn: Function): void {
    this.helpers[name] = fn;
    logger.debug(`Registered helper function: ${name}`, LogCategory.TEMPLATE);
  }

  /**
   * Finds the best template match for the given name.
   * Searches in various locations to accommodate different template organization styles.
   * @param templateName Template name (with or without extension)
   * @returns Result with template info on success, AxeError on failure
   */
  private findTemplate(templateName: string): Result<{ path: string; content: string }, AxeError> {
    // Check for various forms of the template name
    let templateContent: string | undefined;
    
    // Step 1: Direct lookup in cache
    templateContent = this.templates.get(templateName);
    if (templateContent) {
      return ok({ path: templateName, content: templateContent });
    }
    
    // Step 2: Try with extensions
    if (!templateName.endsWith('.eta') && !templateName.endsWith('.ejs')) {
      templateContent = this.templates.get(`${templateName}.eta`);
      if (templateContent) {
        return ok({ path: `${templateName}.eta`, content: templateContent });
      }
      
      templateContent = this.templates.get(`${templateName}.ejs`);
      if (templateContent) {
        return ok({ path: `${templateName}.ejs`, content: templateContent });
      }
    }
    
    // Step 3: Look for framework-specific paths (e.g., express/category/template)
    // Look for templates in express subdirectory
    for (const key of this.templates.keys()) {
      // Look for matches like "express/server/server" or "express/server/server.eta"
      if (
        key.includes(`/${templateName}`) || 
        key.includes(`/${templateName}.`) ||
        key.endsWith(`/${templateName}`)
      ) {
        templateContent = this.templates.get(key);
        if (templateContent) {
          return ok({ path: key, content: templateContent });
        }
      }
      
      // Also try matching just the base name
      const baseName = path.basename(key, path.extname(key));
      if (baseName === templateName) {
        templateContent = this.templates.get(key);
        if (templateContent) {
          return ok({ path: key, content: templateContent });
        }
      }
    }
    
    // Step 4: Try the file system directly
    const expressDir = path.join(this.templateDir, 'express');
    
    // Try several potential locations
    const potentialLocations = [
      path.join(this.templateDir, templateName),
      path.join(this.templateDir, `${templateName}.eta`),
      path.join(this.templateDir, `${templateName}.ejs`),
      // Try direct in express directory
      path.join(expressDir, templateName),
      path.join(expressDir, `${templateName}.eta`),
      path.join(expressDir, `${templateName}.ejs`),
      // Try in category subdirectory
      path.join(expressDir, templateName, `${templateName}.eta`),
      path.join(expressDir, templateName, `${templateName}.ejs`),
      // Try as a subdirectory of category
      path.join(expressDir, path.dirname(templateName), path.basename(templateName), `${path.basename(templateName)}.eta`),
      path.join(expressDir, path.dirname(templateName), path.basename(templateName), `${path.basename(templateName)}.ejs`)
    ];
    
    for (const location of potentialLocations) {
      if (fs.existsSync(location)) {
        try {
          templateContent = fs.readFileSync(location, 'utf-8');
          // Cache for future use
          this.templates.set(templateName, templateContent);
          logger.debug(`Found template at: ${location}`, LogCategory.TEMPLATE);
          return ok({ path: location, content: templateContent });
        } catch (err) {
          logger.warn(`Error reading template file ${location}: ${err}`, LogCategory.TEMPLATE);
        }
      }
    }
    
    // List available templates to help with debugging
    const availableTemplates = Array.from(this.templates.keys())
      .filter(t => !t.includes('/node_modules/'))
      .sort();
    
    logger.error(`Template not found: ${templateName}`, LogCategory.TEMPLATE);
    logger.debug(`Available templates (${availableTemplates.length}):`, LogCategory.TEMPLATE);
    availableTemplates.slice(0, 20).forEach(t => logger.debug(`  - ${t}`, LogCategory.TEMPLATE));
    
    // Template not found - return error
    return err(createGeneratorError(
      3003,
      `Template not found: ${templateName}`,
      { 
        templateName, 
        templateDir: this.templateDir,
        availableTemplates: availableTemplates.slice(0, 20) // List first 20 templates
      }
    ));
  }

  /**
   * Renders a template with the given data.
   * @param templateName Name of the template to render
   * @param data Data to pass to the template
   * @returns Result with rendered content on success, AxeError on failure
   */
  public renderTemplate(templateName: string, data: any): Result<string, AxeError> {
    logger.debug(`Rendering template: ${templateName}${this.isVerbose ? ' (verbose mode)' : ''}`, LogCategory.TEMPLATE);
    
    // Find the template
    const templateResult = this.findTemplate(templateName);
    
    if (templateResult.isErr()) {
      return err(templateResult.error); // Return just the error, not the whole result
    }
    
    const template = templateResult.value;
    logger.debug(`Using template: ${template.path}`, LogCategory.TEMPLATE);

    // Create a context with helpers
    const context = {
      ...data,
      ...this.helpers
    };

    // Render the template
    try {
      // Attempt to render with Eta
      const result = eta.render(template.content, context);
      
      if (result === undefined || result === null) {
        return err(createGeneratorError(
          3004,
          'Eta rendering returned undefined or null',
          { templateName, templatePath: template.path }
        ));
      }
      
      logger.debug(`Successfully rendered template: ${templateName}`, LogCategory.TEMPLATE);
      return ok(result);
    } catch (renderError) {
      logger.error(`Error during template rendering: ${renderError}`, LogCategory.TEMPLATE);
      
      // Extract some template details for error context
      const templatePreview = template.content.substring(0, 100) + '...';
      const dataKeys = Object.keys(data);
      
      return err(createGeneratorError(
        3005,
        `Failed to render template: ${renderError instanceof Error ? renderError.message : String(renderError)}`,
        { 
          templateName,
          templatePath: template.path,
          templatePreview,
          availableData: dataKeys,
          renderError: renderError instanceof Error ? renderError.message : String(renderError)
        },
        renderError instanceof Error ? renderError : new Error(String(renderError))
      ));
    }
  }

  /**
   * Renders a template to a file.
   * For backward compatibility, this throws errors instead of returning Result.
   * @param templateName Name of the template to render
   * @param outputPath Path to output the rendered template
   * @param data Data to pass to the template
   */
  public renderToFile(templateName: string, outputPath: string, data: any): void {
    logger.debug(`Rendering template ${templateName} to file: ${outputPath}`, LogCategory.TEMPLATE);
    
    // Render the template
    const renderResult = this.renderTemplate(templateName, data);
    
    if (renderResult.isErr()) {
      throw renderResult.error; // Throw error for backward compatibility
    }
    
    const output = renderResult.value;
    
    try {
      // Create the output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        logger.debug(`Creating output directory: ${outputDir}`, LogCategory.TEMPLATE);
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the rendered output to the file
      fs.writeFileSync(outputPath, output, 'utf-8');
      logger.debug(`Successfully wrote file: ${outputPath}`, LogCategory.TEMPLATE);
    } catch (error) {
      logger.error(`Error writing template to file: ${error}`, LogCategory.TEMPLATE);
      
      throw createGeneratorError(
        3006,
        `Failed to write template to file: ${outputPath}`,
        { templateName, outputPath },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Renders a template to a file using Result pattern.
   * @param templateName Name of the template to render
   * @param outputPath Path to output the rendered template
   * @param data Data to pass to the template
   * @returns Result with void on success, AxeError on failure
   */
  public renderToFileResult(templateName: string, outputPath: string, data: any): Result<void, AxeError> {
    logger.debug(`Rendering template ${templateName} to file: ${outputPath}`, LogCategory.TEMPLATE);
    
    // Render the template
    const renderResult = this.renderTemplate(templateName, data);
    
    if (renderResult.isErr()) {
      return err(renderResult.error); // Return just the error
    }
    
    const output = renderResult.value;
    
    try {
      // Create the output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        logger.debug(`Creating output directory: ${outputDir}`, LogCategory.TEMPLATE);
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write the rendered output to the file
      fs.writeFileSync(outputPath, output, 'utf-8');
      logger.debug(`Successfully wrote file: ${outputPath}`, LogCategory.TEMPLATE);
      return ok(undefined);
    } catch (error) {
      logger.error(`Error writing template to file: ${error}`, LogCategory.TEMPLATE);
      
      return err(createGeneratorError(
        3006,
        `Failed to write template to file: ${outputPath}`,
        { templateName, outputPath },
        error instanceof Error ? error : new Error(String(error))
      ));
    }
  }

  /**
   * Lists all templates that have been loaded.
   * @returns Array of template names
   */
  public listLoadedTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
  
  /**
   * Enable verbose logging
   */
  public enableVerboseLogging(): void {
    this.isVerbose = true;
  }
}