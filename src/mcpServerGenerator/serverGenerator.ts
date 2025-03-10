// Path: src/mcpServerGenerator/serverGenerator.ts
// Generator for server-related files

import { BaseGenerator } from '@generators/express/baseGenerator';
import { MappedService, GeneratorOptions } from '@axe/schema/types';
import { logger, LogCategory } from '@utils/logger';
import { performance } from '@utils/performanceUtils';
import * as path from 'path';
import { ValidationUtils } from '@utils/validationUtils';

/**
 * Generator for server-related files
 */
export class ServerGenerator extends BaseGenerator {
  /**
   * Generate the server file
   */
  public async generate(
    mappedService: MappedService, 
    options: GeneratorOptions
  ): Promise<void> {
    return performance.track('generate-server-file', async () => {
      logger.info('Generating server file...', LogCategory.GENERATOR);

      // Initialize the generator
      await this.initialize(options);

      // Prepare template data
      const templateData = this.createBaseTemplateData({
        service: mappedService
      });

      // Render and write the file
      const serverPath = path.join(options.outputDir, 'server.ts');
      await this.renderTemplate('server', serverPath, templateData);

      logger.success(`Generated server file: ${path.basename(serverPath)}`, LogCategory.GENERATOR);

      // Generate utility files
      await this.generateUtilFiles(options);
    });
  }

  /**
   * Generate utility files for the server
   */
  private async generateUtilFiles(options: GeneratorOptions): Promise<void> {
    return performance.track('generate-util-files', async () => {
      logger.info('Generating utility files...', LogCategory.GENERATOR);

      // Create utils directory
      const utilsDir = path.join(options.outputDir, 'utils');
      await ValidationUtils.validateDirectory(utilsDir, 1008, undefined, true);

      // Prepare template data
      const templateData = this.createBaseTemplateData();

      // Generate logger utility
      await this.generateLoggerUtil(utilsDir, templateData);

      // Generate error handler utility
      await this.generateErrorHandlerUtil(utilsDir, templateData);
    });
  }

  /**
   * Generate logger utility
   */
  private async generateLoggerUtil(
    utilsDir: string, 
    templateData: Record<string, any>
  ): Promise<void> {
    const loggerPath = path.join(utilsDir, 'logger.ts');
    
    try {
      // Try to use template
      await this.renderTemplate('utils/logger', loggerPath, templateData);
      logger.success('Generated logger utility', LogCategory.GENERATOR);
    } catch (error) {
      // Create a basic logger
      const basicLogger = `// Generated by Axe Handle MCP Server Generator
// Date: ${templateData.date}

/**
 * Simple logger utility
 */
export const logger = {
  info: (message: string) => console.log(\`[INFO] \${message}\`),
  warn: (message: string) => console.warn(\`[WARN] \${message}\`),
  error: (message: string) => console.error(\`[ERROR] \${message}\`)
};
`;
      this.generateBasicFile(loggerPath, basicLogger);
      logger.success('Generated basic logger utility', LogCategory.GENERATOR);
    }
  }

  /**
   * Generate error handler utility
   */
  private async generateErrorHandlerUtil(
    utilsDir: string, 
    templateData: Record<string, any>
  ): Promise<void> {
    const errorHandlerPath = path.join(utilsDir, 'errorHandler.ts');
    
    try {
      // Try to use template
      await this.renderTemplate('utils/errorHandler', errorHandlerPath, templateData);
      logger.success('Generated error handler utility', LogCategory.GENERATOR);
    } catch (error) {
      // Create a basic error handler
      const basicErrorHandler = `// Generated by Axe Handle MCP Server Generator
// Date: ${templateData.date}

/**
 * Error response interface
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Creates an error response object
 */
export function createErrorResponse(
  code: string, 
  message: string, 
  details?: Record<string, unknown>
): ErrorResponse {
  return { code, message, details };
}
`;
      this.generateBasicFile(errorHandlerPath, basicErrorHandler);
      logger.success('Generated basic error handler utility', LogCategory.GENERATOR);
    }
  }
}