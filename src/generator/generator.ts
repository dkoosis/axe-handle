// Path: src/generator/generator.ts
// Generates the TypeScript code for the MCP server based on the mapped service definition.

import * as fs from 'fs/promises';
import * as path from 'path';
import * as ejs from 'ejs';
import {
  MappedService,
  MappedResource,
  MappedType,
  MappedField,
  MappedOperation,
  GeneratorOptions,
  AxeError,
  ErrorPrefix,
  AxeErrorCategory
} from '../types';

/**
 * Creates an AxeError specific to the generator.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createGeneratorError(
  code: number,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error | AxeError
): AxeError {
  return {
    code: `${ErrorPrefix.AXE}-${AxeErrorCategory.GENERATOR}${String(code).padStart(3, '0')}`,
    message,
    details,
    cause,
  };
}

/**
 * Code Generator.
 * Responsible for generating TypeScript code for the MCP server
 * based on the mapped service definition.
 */
class Generator {
  private static instance: Generator;
  
  private templatesDir: string;
  
  private constructor() {
    this.templatesDir = path.resolve(__dirname, '../../../templates');
  }
  
  /**
   * Gets the singleton instance of the Generator.
   * @returns The Generator instance
   */
  public static getInstance(): Generator {
    if (!Generator.instance) {
      Generator.instance = new Generator();
    }
    return Generator.instance;
  }
  
  /**
   * Generates server code for the mapped service.
   * @param mappedService The mapped service
   * @param options Generator options
   */
  public async generateServer(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(options.outputDir, { recursive: true });
      
      // Generate types file
      await this.generateTypesFile(mappedService, options);
      
      // Generate handler files
      await this.generateHandlerFiles(mappedService, options);
      
      // Generate server file
      await this.generateServerFile(mappedService, options);
      
      // Generate index file
      await this.generateIndexFile(mappedService, options);
      
      // Generate documentation (if enabled)
      if (options.generateDocs) {
        await this.generateDocumentation(mappedService, options);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        // Error is already an AxeError, rethrow
        throw error;
      }
      
      throw createGeneratorError(
        1,
        'Failed to generate server code',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Generates the types file.
   * @param mappedService The mapped service
   * @param options Generator options
   */
  private async generateTypesFile(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      const templatePath = path.join(this.templatesDir, 'types.ejs');
      
      // Ensure template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw createGeneratorError(
          2,
          'Types template not found',
          { templatePath },
          error instanceof Error ? error : undefined
        );
      }
      
      // Read template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate types
      const typesContent = await ejs.render(templateContent, {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      }, { async: true });
      
      // Write types file
      const typesPath = path.join(options.outputDir, 'types.ts');
      await fs.writeFile(typesPath, typesContent, 'utf-8');
      
      if (options.verbose) {
        console.log(`Generated types file: ${typesPath}`);
      }
    } catch (error) {
      throw createGeneratorError(
        3,
        'Failed to generate types file',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Generates handler files for each resource.
   * @param mappedService The mapped service
   * @param options Generator options
   */
  private async generateHandlerFiles(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      const handlersDir = path.join(options.outputDir, 'handlers');
      await fs.mkdir(handlersDir, { recursive: true });
      
      const templatePath = path.join(this.templatesDir, 'handler.ejs');
      
      // Ensure template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw createGeneratorError(
          4,
          'Handler template not found',
          { templatePath },
          error instanceof Error ? error : undefined
        );
      }
      
      // Read template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate handler files for each resource
      for (const resource of mappedService.resources) {
        const handlerContent = await ejs.render(templateContent, {
          service: mappedService,
          resource,
          date: new Date().toISOString(),
          version: '0.1.0'
        }, { async: true });
        
        // Convert resource name to kebab-case for filename
        const kebabCase = this.camelToKebabCase(resource.name);
        const handlerPath = path.join(handlersDir, `${kebabCase}.ts`);
        await fs.writeFile(handlerPath, handlerContent, 'utf-8');
        
        if (options.verbose) {
          console.log(`Generated handler file: ${handlerPath}`);
        }
      }
    } catch (error) {
      throw createGeneratorError(
        5,
        'Failed to generate handler files',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Generates the server file.
   * @param mappedService The mapped service
   * @param options Generator options
   */
  private async generateServerFile(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      const templatePath = path.join(this.templatesDir, 'server.ejs');
      
      // Ensure template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw createGeneratorError(
          6,
          'Server template not found',
          { templatePath },
          error instanceof Error ? error : undefined
        );
      }
      
      // Read template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate server
      const serverContent = await ejs.render(templateContent, {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      }, { async: true });
      
      // Write server file
      const serverPath = path.join(options.outputDir, 'server.ts');
      await fs.writeFile(serverPath, serverContent, 'utf-8');
      
      if (options.verbose) {
        console.log(`Generated server file: ${serverPath}`);
      }
    } catch (error) {
      throw createGeneratorError(
        7,
        'Failed to generate server file',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Generates the index file.
   * @param mappedService The mapped service
   * @param options Generator options
   */
  private async generateIndexFile(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      const templatePath = path.join(this.templatesDir, 'index.ejs');
      
      // Ensure template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw createGeneratorError(
          8,
          'Index template not found',
          { templatePath },
          error instanceof Error ? error : undefined
        );
      }
      
      // Read template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate index
      const indexContent = await ejs.render(templateContent, {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      }, { async: true });
      
      // Write index file
      const indexPath = path.join(options.outputDir, 'index.ts');
      await fs.writeFile(indexPath, indexContent, 'utf-8');
      
      if (options.verbose) {
        console.log(`Generated index file: ${indexPath}`);
      }
    } catch (error) {
      throw createGeneratorError(
        9,
        'Failed to generate index file',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Generates documentation.
   * @param mappedService The mapped service
   * @param options Generator options
   */
  private async generateDocumentation(
    mappedService: MappedService,
    options: GeneratorOptions
  ): Promise<void> {
    try {
      const docsDir = path.join(options.outputDir, 'docs');
      await fs.mkdir(docsDir, { recursive: true });
      
      const templatePath = path.join(this.templatesDir, 'api.ejs');
      
      // Ensure template exists
      try {
        await fs.access(templatePath);
      } catch (error) {
        throw createGeneratorError(
          10,
          'API documentation template not found',
          { templatePath },
          error instanceof Error ? error : undefined
        );
      }
      
      // Read template
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Generate API documentation
      const apiContent = await ejs.render(templateContent, {
        service: mappedService,
        date: new Date().toISOString(),
        version: '0.1.0'
      }, { async: true });
      
      // Write API documentation file
      const apiPath = path.join(docsDir, 'api.md');
      await fs.writeFile(apiPath, apiContent, 'utf-8');
      
      if (options.verbose) {
        console.log(`Generated API documentation: ${apiPath}`);
      }
    } catch (error) {
      throw createGeneratorError(
        11,
        'Failed to generate documentation',
        { serviceName: mappedService.name },
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  
  /**
   * Converts a camelCase string to kebab-case.
   * @param str The string to convert
   * @returns The converted string
   */
  private camelToKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
}

// Export the singleton instance
export const generator = Generator.getInstance();