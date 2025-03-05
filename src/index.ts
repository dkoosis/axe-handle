// src/index.ts import update
import * as path from 'path';
import { GeneratorOptions, AxeError } from './types';
import { parseProtocol } from './parser/protocol'; // Updated import
import { serviceParser } from './parser/serviceParser';
import { mapper } from './mcp/mapper';
import { mcpServerGenerator } from './generator/mcpServerGenerator';
import { getConfigManager } from './utils/configManager';
import { getTemplateSystem } from './utils/templateSystem';
import { createAsyncErrorBoundary } from './utils/errorBoundary';
import { logger, LogCategory, LogLevel } from './utils/logger';
import { performance } from './utils/performanceUtils';
import { ValidationUtils } from './utils/validationUtils';
import { runAsyncOperation } from './utils/resultUtils';

/**
 * Initialize the application by setting up the template system
 * and config manager with proper paths.
 */
export function initialize(options: { verbose?: boolean } = {}): void {
  // Configure logger
  logger.updateConfig({
    level: options.verbose ? LogLevel.DEBUG : LogLevel.INFO,
    colors: true,
    timestamps: options.verbose
  });
  
  // Enable performance tracking if verbose
  performance.setEnabled(options.verbose || false);
  
  // Initialize the template system with the default templates directory
  const templatesDir = path.resolve(__dirname, '../templates');
  getTemplateSystem({
    baseDir: templatesDir,
    cache: true,
    helpers: { 
      // Register common helpers
      isRequestType: (type: string) => type.endsWith('Request'),
      isResponseType: (type: string) => type.endsWith('Result') || type.endsWith('Response'),
      getResponseTypeForRequest: (requestType: string) => requestType.replace('Request', 'Result'),
      getMethodFromRequest: (requestType: string) => {
        const methodParts = requestType.replace('Request', '').split(/(?=[A-Z])/);
        return methodParts.map(part => part.toLowerCase()).join('_');
      }
    }
  });
  
  // Initialize the config manager (no action needed, just ensures it's created)
  getConfigManager();
  
  logger.debug('Application initialized', LogCategory.GENERAL);
}
  