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
export declare class ConfigManager {
    private static instance;
    private config;
    /**
     * Creates a new ConfigManager.
     */
    private constructor();
    /**
     * Gets the singleton instance of the ConfigManager.
     * @returns The ConfigManager instance
     */
    static getInstance(): ConfigManager;
    /**
     * Gets the default configuration.
     * @returns The default configuration
     */
    private getDefaultConfig;
    /**
     * Gets the current configuration.
     * @returns The current configuration
     */
    getConfig(): GeneratorConfig;
    /**
     * Updates the configuration with the provided partial configuration.
     * @param partialConfig Partial configuration to merge with the current configuration
     */
    updateConfig(partialConfig: Partial<GeneratorConfig>): void;
    /**
     * Merges two configurations.
     * @param baseConfig The base configuration
     * @param overrideConfig The configuration to override with
     * @returns The merged configuration
     */
    private mergeConfigs;
    /**
     * Loads a configuration file.
     * @param configPath Path to the configuration file
     */
    loadConfigFile(configPath: string): Promise<void>;
    /**
     * Validates a configuration object.
     * @param config The configuration to validate
     * @throws Error if the configuration is invalid
     */
    private validateConfig;
    /**
     * Saves the current configuration to a file.
     * @param configPath Path to save the configuration to
     */
    saveConfigFile(configPath: string): Promise<void>;
    /**
     * Resets the configuration to the default values.
     */
    resetConfig(): void;
}
export declare function getConfigManager(): ConfigManager;
