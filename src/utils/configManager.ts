// src/utils/configManager.ts
import * as fs from 'fs/promises';
import * as path from 'path';
import { createGeneratorError } from './errorUtils';
import { logger, LogCategory } from './logger';

/**
 * Generator configuration with typed options
 */
export interface GeneratorConfig {
  // Project configuration
  projectName: string;
  version: string;
  description: string;
  author: string;
  license: string;
  
  // Server configuration
  framework: 'express' | 'nestjs' | 'fastify';
  host: string;
  port: number;
  
  // TypeScript configuration
  typescript: {
    target: string;
    module: string;
    strict: boolean;
    outDir: string;
  };
  
  // Feature flags
  features: {
    generateOpenApiDocs: boolean;
    generateTests: boolean;
    includeExamples: boolean;
    strictValidation: boolean;
  };
  
  // Dependencies and scripts
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  
  // Extension point for custom configuration
  custom: Record<string, any>;
}

/**
 * Enhanced configuration manager with validation and extensibility
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: GeneratorConfig;
  private configPath?: string;
  
  private constructor() {
    this.config = this.getDefaultConfig();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  /**
   * Get default configuration
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
      
      typescript: {
        target: 'ES2020',
        module: 'NodeNext',
        strict: true,
        outDir: 'dist'
      },
      
      features: {
        generateOpenApiDocs: true,
        generateTests: true,
        includeExamples: true,
        strictValidation: false
      },
      
      dependencies: {},
      devDependencies: {},
      scripts: {},
      
      custom: {}
    };
  }
  
  /**
   * Get the current configuration
   */
  public getConfig(): GeneratorConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration with partial values
   */
  public updateConfig(partialConfig: Partial<GeneratorConfig>): void {
    logger.debug('Updating configuration', LogCategory.CONFIG);
    this.config = this.mergeConfigs(this.config, partialConfig);
  }
  
  /**
   * Get a specific configuration value
   */
  public get<K extends keyof GeneratorConfig>(key: K): GeneratorConfig[K] {
    return this.config[key];
  }
  
  /**
   * Set a specific configuration value
   */
  public set<K extends keyof GeneratorConfig>(key: K, value: GeneratorConfig[K]): void {
    logger.debug(`Setting config ${String(key)}`, LogCategory.CONFIG);
    this.config[key] = value;
  }
  
  /**
   * Load configuration from a file
   */
  public async loadConfigFile(configPath: string): Promise<void> {
    try {
      logger.info(`Loading configuration from ${configPath}`, LogCategory.CONFIG);
      
      // Read and parse the configuration file
      const content = await fs.readFile(configPath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Validate the configuration
      this.validateConfig(parsed);
      
      // Store the config path for later save operations
      this.configPath = configPath;
      
      // Update the configuration
      this.updateConfig(parsed);
      
      logger.success('Configuration loaded successfully', LogCategory.CONFIG);
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
   * Merge configurations deeply
   */
  private mergeConfigs(
    baseConfig: GeneratorConfig,
    overrideConfig: Partial<GeneratorConfig>
  ): GeneratorConfig {
    const result = { ...baseConfig };
    
    for (const [key, value] of Object.entries(overrideConfig)) {
      const typedKey = key as keyof GeneratorConfig;
      
      // Handle nested objects
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        typeof result[typedKey] === 'object' &&
        result[typedKey] !== null &&
        !Array.isArray(result[typedKey])
      ) {
        // Recursively merge nested objects
        (result[typedKey] as any) = this.mergeDeep(
          result[typedKey] as Record<string, any>,
          value as Record<string, any>
        );
      } else if (value !== undefined) {
        // Set value directly
        (result[typedKey] as any) = value;
      }
    }
    
    return result;
  }
  
  /**
   * Deep merge helper for nested objects
   */
  private mergeDeep(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        key in result &&
        typeof result[key] === 'object' &&
        result[key] !== null &&
        !Array.isArray(result[key])
      ) {
        // Recursively merge nested objects
        result[key] = this.mergeDeep(result[key], value);
      } else if (value !== undefined) {
        // Set value directly
        result[key] = value;
      }
    }
    
    return result;
  }
  
  /**
   * Validate configuration
   */
  private validateConfig(config: any): void {
    // Check if config is an object
    if (!config || typeof config !== 'object') {
      throw createGeneratorError(
        3002,
        'Invalid configuration: must be an object',
        { config }
      );
    }
    
    // Check framework
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
    
    // Check port range
    if (config.port && (config.port < 1 || config.port > 65535)) {
      throw createGeneratorError(
        3004,
        'Invalid configuration: port must be between 1 and 65535',
        { port: config.port }
      );
    }
    
    // More validations can be added as needed
  }
  
  /**
   * Save configuration to a file
   */
  public async saveConfigFile(configPath?: string): Promise<void> {
    const savePath = configPath || this.configPath;
    
    if (!savePath) {
      throw createGeneratorError(
        3005,
        'No configuration path specified for saving',
        {}
      );
    }
    
    try {
      logger.info(`Saving configuration to ${savePath}`, LogCategory.CONFIG);
      
      // Ensure directory exists
      const dir = path.dirname(savePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write configuration file
      await fs.writeFile(
        savePath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
      
      logger.success('Configuration saved successfully', LogCategory.CONFIG);
    } catch (error) {
      throw createGeneratorError(
        3006,
        `Failed to save configuration file: ${savePath}`,
        { configPath: savePath },
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    logger.info('Resetting configuration to defaults', LogCategory.CONFIG);
    this.config = this.getDefaultConfig();
  }
  
  /**
   * Add custom configuration
   */
  public addCustomConfig(key: string, value: any): void {
    logger.debug(`Adding custom config: ${key}`, LogCategory.CONFIG);
    this.config.custom[key] = value;
  }
  
  /**
   * Get custom configuration
   */
  public getCustomConfig(key: string): any {
    return this.config.custom[key];
  }
}

// Export factory function
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}