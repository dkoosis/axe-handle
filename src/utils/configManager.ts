// Path: src/utils/configManager.ts
// Provides a centralized configuration management system for the Axe Handle code generator.

import * as fs from 'fs/promises';
import * as path from 'path';
import { createGeneratorError } from './errorUtils';

/**
 * Generator configuration.
 */
export interface GeneratorConfig {
  /** Project name for the generated code */
  projectName: string;
  /** Project version */
  version: string;
  /** Project description */
  description: string;
  /** Project author */
  author: string;
  /** Project license */
  license: string;
  /** Server framework to use */
  framework: 'express' | 'nestjs' | 'fastify';
  /** Host for the server */
  host: string;
  /** Port for the server */
  port: number;
  /** Whether to generate OpenAPI documentation */
  generateOpenApiDocs: boolean;
  /** Configuration for TypeScript */
  typescript: {
    /** Target ECMAScript version */
    target: string;
    /** Module system */
    module: string;
    /** Strict type-checking options */
    strict: boolean;
    /** Output directory */
    outDir: string;
  };
  /** Additional dependencies to include */
  dependencies: Record<string, string>;
  /** Additional dev dependencies to include */
  devDependencies: Record<string, string>;
  /** Additional scripts to include */
  scripts: Record<string, string>;
}

/**
 * Configuration Manager.
 * Responsible for managing configuration, loading config files,
 * and providing a unified interface for accessing configuration.
 */
export class ConfigManager {
  private static instance: ConfigManager;
  
  private config: GeneratorConfig;
  
  /**
   * Creates a new ConfigManager.
   */
  private constructor() {
    // Set default configuration
    this.config = this.getDefaultConfig();
  }
  
  /**
   * Gets the singleton instance of the ConfigManager.
   * @returns The ConfigManager instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  /**
   * Gets the default configuration.
   * @returns The default configuration
   */
  private getDefaultConfig(): GeneratorConfig {
    return {
      projectName: 'mcp-server',
      version: '0.1.0',
      description: 'MCP Protocol Server',
      author: process.env.USER || 'MCP Generator User',
      license: 'MIT',
      framework: 'express',
      host: 'localhost',
      port: 3000,
      generateOpenApiDocs: true,
      typescript: {
        target: 'ES2020',
        module: 'NodeNext',
        strict: true,
        outDir: 'dist'
      },
      dependencies: {},
      devDependencies: {},
      scripts: {}
    };
  }
  
  /**
   * Gets the current configuration.
   * @returns The current configuration
   */
  public getConfig(): GeneratorConfig {
    return { ...this.config };
  }
  
  /**
   * Updates the configuration with the provided partial configuration.
   * @param partialConfig Partial configuration to merge with the current configuration
   */
  public updateConfig(partialConfig: Partial<GeneratorConfig>): void {
    this.config = this.mergeConfigs(this.config, partialConfig);
  }
  
  /**
   * Merges two configurations.
   * @param baseConfig The base configuration
   * @param overrideConfig The configuration to override with
   * @returns The merged configuration
   */
  private mergeConfigs(
    baseConfig: GeneratorConfig,
    overrideConfig: Partial<GeneratorConfig>
  ): GeneratorConfig {
    // Start with a copy of the base config
    const result: GeneratorConfig = { ...baseConfig };
    
    // Override top-level properties
    for (const key of Object.keys(overrideConfig) as Array<keyof GeneratorConfig>) {
      if (key === 'typescript') {
        // For typescript, we need to merge the sub-properties
        result.typescript = {
          ...result.typescript,
          ...(overrideConfig.typescript || {})
        };
      } else if (
        key === 'dependencies' || 
        key === 'devDependencies' || 
        key === 'scripts'
      ) {
        // For objects, we need to merge the properties
        result[key] = {
          ...result[key],
          ...(overrideConfig[key] || {})
        };
      } else if (overrideConfig[key] !== undefined) {
        // For primitive values, we can just override
        (result[key] as any) = overrideConfig[key];
      }
    }
    
    return result;
  }
  
  /**
   * Loads a configuration file.
   * @param configPath Path to the configuration file
   */
  public async loadConfigFile(configPath: string): Promise<void> {
    try {
      // Read the configuration file
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      // Parse the configuration
      const parsedConfig = JSON.parse(configContent);
      
      // Validate the configuration
      this.validateConfig(parsedConfig);
      
      // Update the configuration
      this.updateConfig(parsedConfig);
    } catch (error) {
      throw createGeneratorError(
        3001,
        `Failed to load configuration file: ${configPath}`,
        { configPath },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Validates a configuration object.
   * @param config The configuration to validate
   * @throws Error if the configuration is invalid
   */
  private validateConfig(config: any): void {
    // Check if the config is an object
    if (!config || typeof config !== 'object') {
      throw createGeneratorError(
        3002,
        'Invalid configuration: must be an object',
        { config }
      );
    }
    
    // Check if the framework is valid
    if (
      config.framework && 
      !['express', 'nestjs', 'fastify'].includes(config.framework)
    ) {
      throw createGeneratorError(
        3003,
        `Invalid configuration: framework must be one of 'express', 'nestjs', or 'fastify'`,
        { framework: config.framework }
      );
    }
    
    // Add more validation as needed
  }
  
  /**
   * Saves the current configuration to a file.
   * @param configPath Path to save the configuration to
   */
  public async saveConfigFile(configPath: string): Promise<void> {
    try {
      // Create the directory if it doesn't exist
      const configDir = path.dirname(configPath);
      await fs.mkdir(configDir, { recursive: true });
      
      // Write the configuration to the file
      await fs.writeFile(
        configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw createGeneratorError(
        3004,
        `Failed to save configuration file: ${configPath}`,
        { configPath },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Resets the configuration to the default values.
   */
  public resetConfig(): void {
    this.config = this.getDefaultConfig();
  }
}

// Export a function to get the singleton instance
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}
