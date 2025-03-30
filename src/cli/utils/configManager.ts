/**
 * @file ${filename}
 * @description ${description}
 * @author ${author}
 * @created ${created}
 * @copyright ${copyright}
 * @license ${license}
 */

/**
 * Configuration manager for the Axe Handle generator
 */
export class ConfigManager {
  private config: Record<string, any> = {};
  private static instance: ConfigManager;

  private constructor() {
    // Initialize with default configuration
    this.config = {
      templateDir: './templates',
      outputDir: './generated',
      overwrite: false,
    };
  }

  /**
   * Get the singleton instance of ConfigManager
   */
  public static getInstance(): ConfigManager {
    if (!this.instance) {
      this.instance = new ConfigManager();
    }
    return this.instance;
  }

  /**
   * Load configuration from a file
   * @param filePath Path to configuration file
   */
  public loadFromFile(_filePath: string): boolean {
    // Implementation will be added later
    // Currently unused parameter is prefixed with underscore
    return true;
  }

  /**
   * Get configuration value
   * @param key Configuration key
   * @param defaultValue Default value if key doesn't exist
   */
  public get<T>(key: string, defaultValue?: T): T {
    return (this.config[key] as T) || (defaultValue as T);
  }

  /**
   * Set configuration value
   * @param key Configuration key
   * @param value Configuration value
   */
  public set(key: string, value: any): void {
    this.config[key] = value;
  }
}

/**
 * Get the singleton instance of ConfigManager
 */
export function getConfigManager(): ConfigManager {
  return ConfigManager.getInstance();
}
