// Path: src/utils/templateSystem.ts
// Unified template system for the Axe Handle code generator with Result-based error handling

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import * as eta from 'eta';
import { Result, ok, err } from 'neverthrow';
import { logger, LogCategory } from './logger';

/**
 * Base error class for template system errors
 */
export class TemplateError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(message);
    this.code = code;
    this.details = details;
    this.cause = cause;
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when a template cannot be found
 */
export class TemplateNotFoundError extends TemplateError {
  constructor(
    templateName: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      'AXE-3003',
      `Template not found: ${templateName}`,
      details,
      cause
    );
  }
}

/**
 * Error thrown when template rendering fails
 */
export class TemplateRenderError extends TemplateError {
  constructor(
    templateName: string,
    details?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      'AXE-3005',
      `Failed to render template: ${templateName}`,
      details,
      cause
    );
  }
}

/**
 * Result type for template operations
 */
export type TemplateResult<T> = Result<T, TemplateError>;

/**
 * Template system options
 */
export interface TemplateSystemOptions {
  /** Base directory for templates */
  baseDir: string;
  /** Whether to cache templates */
  cache?: boolean;
  /** Whether to enable verbose logging */
  verbose?: boolean;
  /** Custom helper functions */
  helpers?: Record<string, Function>;
}

/**
 * A template file with its content and metadata
 */
export interface Template {
  /** Template name/path */
  name: string;
  /** Absolute path to the template file */
  absolutePath: string;
  /** Template content */
  content: string;
}

/**
 * Unified template system for Express.js code generation with Result-based error handling
 */
export class TemplateSystem {
  private static instance: TemplateSystem;
  private baseDir: string;
  private cache: boolean;
  private verbose: boolean;
  private initialized: boolean = false;
  private templateCache: Map<string, Template> = new Map();
  private helpers: Record<string, Function> = {};

  /**
   * Creates a new Template System
   * @param options Configuration options
   */
  private constructor(options: TemplateSystemOptions) {
    this.baseDir = options.baseDir;
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
   * @param options Configuration options (only used on first creation)
   */
  public static getInstance(options?: TemplateSystemOptions): TemplateSystem {
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
   * Update template system configuration
   * @param options New configuration options
   */
  public updateConfig(options: Partial<TemplateSystemOptions>): void {
    if (options.baseDir) {
      this.baseDir = options.baseDir;
      eta.configure({ views: this.baseDir });
    }
    if (options.cache !== undefined) {
      this.cache = options.cache;
      eta.configure({ cache: this.cache });
    }
    if (options.verbose !== undefined) {
      this.verbose = options.verbose;
      eta.configure({ debug: this.verbose });
    }
    if (options.helpers) {
      for (const [name, fn] of Object.entries(options.helpers)) {
        this.registerHelper(name, fn);
      }
    }

    logger.debug('Template system configuration updated', LogCategory.TEMPLATE);
  }

  /**
   * Initialize the template system by validating the template directory exists
   * @returns A Result with success or error
   */
  public initialize(): TemplateResult<void> {
    if (this.initialized) {
      return ok(undefined);
    }

    try {
      logger.debug('Initializing template system...', LogCategory.TEMPLATE);

      // Check if base directory exists
      if (!fs.existsSync(this.baseDir)) {
        return err(
          new TemplateError(
            'AXE-3001',
            `Template directory not found: ${this.baseDir}`,
            { baseDir: this.baseDir }
          )
        );
      }

      // Check if Express template directory exists
      const expressDir = path.join(this.baseDir, 'express');
      if (!fs.existsSync(expressDir)) {
        logger.warn(`Express template directory not found: ${expressDir}`, LogCategory.TEMPLATE);
      } else {
        logger.debug(`Express template directory found: ${expressDir}`, LogCategory.TEMPLATE);
      }

      this.initialized = true;
      logger.debug('Template system initialized successfully', LogCategory.TEMPLATE);
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize template system: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateError(
          'AXE-3002',
          `Failed to initialize template system: ${errorMessage}`,
          { baseDir: this.baseDir },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Asynchronously initializes the template system
   * @returns A Promise with a Result of success or error
   */
  public async initializeAsync(): Promise<TemplateResult<void>> {
    if (this.initialized) {
      return ok(undefined);
    }

    try {
      logger.debug('Initializing template system asynchronously...', LogCategory.TEMPLATE);

      // Check if base directory exists
      try {
        await fsPromises.access(this.baseDir);
      } catch (error) {
        return err(
          new TemplateError(
            'AXE-3001',
            `Template directory not found: ${this.baseDir}`,
            { baseDir: this.baseDir },
            error instanceof Error ? error : undefined
          )
        );
      }

      // Check if Express template directory exists
      const expressDir = path.join(this.baseDir, 'express');
      try {
        await fsPromises.access(expressDir);
        logger.debug(`Express template directory found: ${expressDir}`, LogCategory.TEMPLATE);
      } catch {
        logger.warn(`Express template directory not found: ${expressDir}`, LogCategory.TEMPLATE);
      }

      this.initialized = true;
      logger.debug('Template system initialized successfully', LogCategory.TEMPLATE);
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to initialize template system: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateError(
          'AXE-3002',
          `Failed to initialize template system: ${errorMessage}`,
          { baseDir: this.baseDir },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Resolves the best matching template path based on the given name
   * @param templateName Template name (with or without extension)
   * @returns Result with the template path or an error
   */
  public resolveTemplatePath(templateName: string): TemplateResult<string> {
    logger.debug(`Resolving template path for: ${templateName}`, LogCategory.TEMPLATE);

    // Normalize template name
    const normalizedName = this.normalizeTemplateName(templateName);
    
    // List of paths to try, in order of preference
    const pathsToTry = this.getTemplatePaths(normalizedName);

    // Try each path
    for (const templatePath of pathsToTry) {
      if (fs.existsSync(templatePath)) {
        logger.debug(`Found template at: ${templatePath}`, LogCategory.TEMPLATE);
        return ok(templatePath);
      }
    }

    // If no template is found, return an error
    logger.error(`Template not found: ${templateName}`, LogCategory.TEMPLATE);
    
    return err(
      new TemplateNotFoundError(templateName, {
        triedPaths: pathsToTry,
        baseDir: this.baseDir
      })
    );
  }

  /**
   * Normalizes a template name, ensuring consistent format
   * @param templateName Original template name
   * @returns Normalized template name
   */
  private normalizeTemplateName(templateName: string): string {
    // Remove leading slashes and normalize path separators
    let normalized = templateName.replace(/^[/\\]+/, '').replace(/\\/g, '/');

    // Return the normalized name
    return normalized;
  }

  /**
   * Generates a list of potential template paths to try, in order of preference
   * @param normalizedName Normalized template name
   * @returns Array of template paths to try
   */
  private getTemplatePaths(normalizedName: string): string[] {
    const pathsToTry: string[] = [];
    const expressDir = path.join(this.baseDir, 'express');
    const templateBaseName = path.basename(normalizedName, path.extname(normalizedName));
    
    // Check if it already has an extension
    const hasExtension = normalizedName.endsWith('.eta') || normalizedName.endsWith('.ejs');
    const nameWithoutExt = hasExtension 
      ? normalizedName.substring(0, normalizedName.lastIndexOf('.'))
      : normalizedName;
    
    // Express template paths (preferred)
    pathsToTry.push(
      // 1. Try direct path in express dir
      path.join(expressDir, hasExtension ? normalizedName : `${normalizedName}.eta`),
      path.join(expressDir, `${nameWithoutExt}.eta`),
      path.join(expressDir, `${nameWithoutExt}.ejs`),
      
      // 2. Try in category subdir in express dir (e.g., express/server/server.eta)
      path.join(expressDir, templateBaseName, `${templateBaseName}.eta`),
      path.join(expressDir, templateBaseName, `${templateBaseName}.ejs`),
      
      // 3. Try in template category directories (for structured templates)
      path.join(expressDir, path.dirname(normalizedName), `${templateBaseName}.eta`),
      path.join(expressDir, path.dirname(normalizedName), `${templateBaseName}.ejs`)
    );
    
    // Base directory paths
    pathsToTry.push(
      // 4. Try direct path in base dir
      path.join(this.baseDir, hasExtension ? normalizedName : `${normalizedName}.eta`),
      path.join(this.baseDir, `${nameWithoutExt}.eta`),
      path.join(this.baseDir, `${nameWithoutExt}.ejs`),
      
      // 5. Try in template category directories in base dir
      path.join(this.baseDir, path.dirname(normalizedName), `${templateBaseName}.eta`),
      path.join(this.baseDir, path.dirname(normalizedName), `${templateBaseName}.ejs`)
    );
    
    // Filter out duplicate paths and return
    return [...new Set(pathsToTry)];
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
    const pathResult = this.resolveTemplatePath(templateName);
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
        new TemplateError(
          'AXE-3004',
          `Failed to load template ${templateName}: ${errorMessage}`,
          { templateName, templatePath },
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
    const pathResult = this.resolveTemplatePath(templateName);
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
        new TemplateError(
          'AXE-3004',
          `Failed to load template ${templateName}: ${errorMessage}`,
          { templateName, templatePath },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Renders a template with data
   * @param templateName Template name
   * @param data Data to render the template with
   * @returns Result with the rendered content or an error
   */
  public renderTemplate(templateName: string, data: any): TemplateResult<string> {
    logger.debug(`Rendering template: ${templateName}`, LogCategory.TEMPLATE);
    
    // Ensure we're initialized
    if (!this.initialized) {
      const initResult = this.initialize();
      if (initResult.isErr()) {
        return err(initResult.error);
      }
    }
    
    // Load the template
    const templateResult = this.loadTemplate(templateName);
    if (templateResult.isErr()) {
      return err(templateResult.error);
    }
    
    const template = templateResult.value;
    
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
          new TemplateRenderError(templateName, {
            reason: 'Rendering returned undefined',
            templatePath: template.absolutePath
          })
        );
      }
      
      logger.debug(`Template rendered successfully: ${templateName}`, LogCategory.TEMPLATE);
      return ok(rendered);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to render template: ${errorMessage}`, LogCategory.TEMPLATE);
      
      // Analyze available data for diagnostics
      const availableDataKeys = Object.keys(data || {});
      const templatePreview = template.content.substring(0, 300) + (template.content.length > 300 ? '...' : '');
      
      return err(
        new TemplateRenderError(templateName, {
          reason: errorMessage,
          templatePath: template.absolutePath,
          availableDataKeys,
          templatePreview
        }, error instanceof Error ? error : undefined)
      );
    }
  }

  /**
   * Asynchronously renders a template with data
   * @param templateName Template name
   * @param data Data to render the template with
   * @returns Promise with Result containing the rendered content or an error
   */
  public async renderTemplateAsync(templateName: string, data: any): Promise<TemplateResult<string>> {
    logger.debug(`Rendering template asynchronously: ${templateName}`, LogCategory.TEMPLATE);
    
    // Ensure we're initialized
    if (!this.initialized) {
      const initResult = await this.initializeAsync();
      if (initResult.isErr()) {
        return err(initResult.error);
      }
    }
    
    // Load the template
    const templateResult = await this.loadTemplateAsync(templateName);
    if (templateResult.isErr()) {
      return err(templateResult.error);
    }
    
    const template = templateResult.value;
    
    try {
      // Create a context with helpers
      const context = {
        ...data,
        ...this.helpers
      };
      
      // Render the template asynchronously
      const rendered = await eta.renderAsync(template.content, context, {
        filename: template.absolutePath,
        root: this.baseDir,
        debug: this.verbose,
        cache: this.cache,
        async: true
      });
      
      if (rendered === undefined) {
        return err(
          new TemplateRenderError(templateName, {
            reason: 'Rendering returned undefined',
            templatePath: template.absolutePath
          })
        );
      }
      
      logger.debug(`Template rendered successfully: ${templateName}`, LogCategory.TEMPLATE);
      return ok(rendered);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to render template: ${errorMessage}`, LogCategory.TEMPLATE);
      
      // Analyze available data for diagnostics
      const availableDataKeys = Object.keys(data || {});
      const templatePreview = template.content.substring(0, 300) + (template.content.length > 300 ? '...' : '');
      
      return err(
        new TemplateRenderError(templateName, {
          reason: errorMessage,
          templatePath: template.absolutePath,
          availableDataKeys,
          templatePreview
        }, error instanceof Error ? error : undefined)
      );
    }
  }

  /**
   * Renders a template to a file
   * @param templateName Template name
   * @param outputPath Output file path
   * @param data Data to render the template with
   * @returns Result with void on success or an error
   */
  public renderToFile(templateName: string, outputPath: string, data: any): TemplateResult<void> {
    logger.debug(`Rendering template ${templateName} to file: ${outputPath}`, LogCategory.TEMPLATE);
    
    // Render the template
    const renderResult = this.renderTemplate(templateName, data);
    if (renderResult.isErr()) {
      return err(renderResult.error);
    }
    
    const content = renderResult.value;
    
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
        new TemplateError(
          'AXE-3006',
          `Failed to write template output to file: ${errorMessage}`,
          { templateName, outputPath },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Asynchronously renders a template to a file
   * @param templateName Template name
   * @param outputPath Output file path
   * @param data Data to render the template with
   * @returns Promise with Result containing void on success or an error
   */
  public async renderToFileAsync(templateName: string, outputPath: string, data: any): Promise<TemplateResult<void>> {
    logger.debug(`Rendering template ${templateName} to file asynchronously: ${outputPath}`, LogCategory.TEMPLATE);
    
    // Render the template
    const renderResult = await this.renderTemplateAsync(templateName, data);
    if (renderResult.isErr()) {
      return err(renderResult.error);
    }
    
    const content = renderResult.value;
    
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fsPromises.mkdir(outputDir, { recursive: true });
      
      // Write the file
      await fsPromises.writeFile(outputPath, content, 'utf-8');
      
      logger.debug(`File written successfully: ${outputPath}`, LogCategory.TEMPLATE);
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to write file: ${errorMessage}`, LogCategory.TEMPLATE);
      
      return err(
        new TemplateError(
          'AXE-3006',
          `Failed to write template output to file: ${errorMessage}`,
          { templateName, outputPath },
          error instanceof Error ? error : undefined
        )
      );
    }
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
   * Clears the template cache
   */
  public clearCache(): void {
    this.templateCache.clear();
    eta.configure({ cache: false });
    
    // Re-enable caching if it was enabled
    if (this.cache) {
      eta.configure({ cache: true });
    }
    
    logger.debug('Template cache cleared', LogCategory.TEMPLATE);
  }

  /**
   * Lists available templates in a directory
   * @param directory Relative path from baseDir (optional)
   * @returns Result with template names or an error
   */
  public listTemplates(directory: string = ''): TemplateResult<string[]> {
    try {
      const dirPath = path.join(this.baseDir, directory);
      
      if (!fs.existsSync(dirPath)) {
        return err(
          new TemplateError(
            'AXE-3007',
            `Directory not found: ${dirPath}`,
            { baseDir: this.baseDir, directory }
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
        new TemplateError(
          'AXE-3008',
          `Failed to list templates: ${errorMessage}`,
          { baseDir: this.baseDir, directory },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Asynchronously lists available templates in a directory
   * @param directory Relative path from baseDir (optional)
   * @returns Promise with Result containing template names or an error
   */
  public async listTemplatesAsync(directory: string = ''): Promise<TemplateResult<string[]>> {
    try {
      const dirPath = path.join(this.baseDir, directory);
      
      try {
        await fsPromises.access(dirPath);
      } catch {
        return err(
          new TemplateError(
            'AXE-3007',
            `Directory not found: ${dirPath}`,
            { baseDir: this.baseDir, directory }
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
        new TemplateError(
          'AXE-3008',
          `Failed to list templates: ${errorMessage}`,
          { baseDir: this.baseDir, directory },
          error instanceof Error ? error : undefined
        )
      );
    }
  }

  /**
   * Preloads templates from a directory into the cache
   * @param directory Relative path from baseDir (optional)
   * @returns Result with number of loaded templates or an error
   */
  public preloadTemplates(directory: string = ''): TemplateResult<number> {
    logger.debug(`Preloading templates from: ${directory || 'base directory'}`, LogCategory.TEMPLATE);
    
    const templatesResult = this.listTemplates(directory);
    if (templatesResult.isErr()) {
      return err(templatesResult.error);
    }
    
    const templates = templatesResult.value;
    let loadedCount = 0;
    
    for (const templateFile of templates) {
      const templateName = path.join(directory, templateFile);
      const loadResult = this.loadTemplate(templateName);
      
      if (loadResult.isOk()) {
        loadedCount++;
      } else {
        logger.warn(`Failed to preload template: ${templateName}`, LogCategory.TEMPLATE);
      }
    }
    
    logger.debug(`Preloaded ${loadedCount} templates`, LogCategory.TEMPLATE);
    return ok(loadedCount);
  }

  /**
   * Asynchronously preloads templates from a directory into the cache
   * @param directory Relative path from baseDir (optional)
   * @returns Promise with Result containing number of loaded templates or an error
   */
  public async preloadTemplatesAsync(directory: string = ''): Promise<TemplateResult<number>> {
    logger.debug(`Preloading templates asynchronously from: ${directory || 'base directory'}`, LogCategory.TEMPLATE);
    
    const templatesResult = await this.listTemplatesAsync(directory);
    if (templatesResult.isErr()) {
      return err(templatesResult.error);
    }
    
    const templates = templatesResult.value;
    let loadedCount = 0;
    
    // Load templates concurrently
    const loadPromises = templates.map(async (templateFile) => {
      const templateName = path.join(directory, templateFile);
      const loadResult = await this.loadTemplateAsync(templateName);
      
      if (loadResult.isOk()) {
        loadedCount++;
      } else {
        logger.warn(`Failed to preload template: ${templateName}`, LogCategory.TEMPLATE);
      }
    });
    
    await Promise.all(loadPromises);
    
    logger.debug(`Preloaded ${loadedCount} templates`, LogCategory.TEMPLATE);
    return ok(loadedCount);
  }

  /**
   * Checks if a template exists
   * @param templateName Template name
   * @returns Result with boolean indicating existence
   */
  public templateExists(templateName: string): TemplateResult<boolean> {
    // Check if in cache
    if (this.cache && this.templateCache.has(templateName)) {
      return ok(true);
    }
    
    // Try to resolve path
    const pathResult = this.resolveTemplatePath(templateName);
    return ok(pathResult.isOk());
  }

  /**
   * Sets the verbosity level
   * @param verbose Whether to enable verbose logging
   */
  public setVerbose(verbose: boolean): void {
    this.verbose = verbose;
    eta.configure({ debug: verbose });
    logger.debug(`Verbose mode ${verbose ? 'enabled' : 'disabled'}`, LogCategory.TEMPLATE);
  }
}

/**
 * Factory function to get the singleton TemplateSystem instance
 * @param options Options for the template system
 * @returns TemplateSystem instance
 */
export function getTemplateSystem(options?: TemplateSystemOptions): TemplateSystem {
  return TemplateSystem.getInstance(options);
}