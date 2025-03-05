// Path: src/utils/templates/templateResolver.ts
// Handles resolving template paths

import * as fs from 'fs';
import * as path from 'path';
import { ok, err } from 'neverthrow';
import { logger, LogCategory } from '@utils/logger';
import { TemplateResult } from './templateTypes';
import { TemplateNotFoundError } from './templateError';

/**
 * Responsible for resolving template paths
 */
export class TemplateResolver {
  /**
   * Base directory for templates
   */
  public readonly baseDir: string;

  /**
   * Creates a new TemplateResolver
   * @param baseDir Base directory for templates
   */
  constructor(baseDir: string) {
    this.baseDir = baseDir;
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
}