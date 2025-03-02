"use strict";
// Path: src/utils/configManager.ts
// Provides a centralized configuration management system for the Axe Handle code generator.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
exports.getConfigManager = getConfigManager;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const errorUtils_1 = require("./errorUtils");
/**
 * Configuration Manager.
 * Responsible for managing configuration, loading config files,
 * and providing a unified interface for accessing configuration.
 */
class ConfigManager {
    /**
     * Creates a new ConfigManager.
     */
    constructor() {
        // Set default configuration
        this.config = this.getDefaultConfig();
    }
    /**
     * Gets the singleton instance of the ConfigManager.
     * @returns The ConfigManager instance
     */
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    /**
     * Gets the default configuration.
     * @returns The default configuration
     */
    getDefaultConfig() {
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
    getConfig() {
        return { ...this.config };
    }
    /**
     * Updates the configuration with the provided partial configuration.
     * @param partialConfig Partial configuration to merge with the current configuration
     */
    updateConfig(partialConfig) {
        this.config = this.mergeConfigs(this.config, partialConfig);
    }
    /**
     * Merges two configurations.
     * @param baseConfig The base configuration
     * @param overrideConfig The configuration to override with
     * @returns The merged configuration
     */
    mergeConfigs(baseConfig, overrideConfig) {
        // Start with a copy of the base config
        const result = { ...baseConfig };
        // Override top-level properties
        for (const key of Object.keys(overrideConfig)) {
            if (key === 'typescript') {
                // For typescript, we need to merge the sub-properties
                result.typescript = {
                    ...result.typescript,
                    ...(overrideConfig.typescript || {})
                };
            }
            else if (key === 'dependencies' ||
                key === 'devDependencies' ||
                key === 'scripts') {
                // For objects, we need to merge the properties
                result[key] = {
                    ...result[key],
                    ...(overrideConfig[key] || {})
                };
            }
            else if (overrideConfig[key] !== undefined) {
                // For primitive values, we can just override
                result[key] = overrideConfig[key];
            }
        }
        return result;
    }
    /**
     * Loads a configuration file.
     * @param configPath Path to the configuration file
     */
    async loadConfigFile(configPath) {
        try {
            // Read the configuration file
            const configContent = await fs.readFile(configPath, 'utf-8');
            // Parse the configuration
            const parsedConfig = JSON.parse(configContent);
            // Validate the configuration
            this.validateConfig(parsedConfig);
            // Update the configuration
            this.updateConfig(parsedConfig);
        }
        catch (error) {
            throw (0, errorUtils_1.createGeneratorError)(3001, `Failed to load configuration file: ${configPath}`, { configPath }, error instanceof Error ? error : undefined);
        }
    }
    /**
     * Validates a configuration object.
     * @param config The configuration to validate
     * @throws Error if the configuration is invalid
     */
    validateConfig(config) {
        // Check if the config is an object
        if (!config || typeof config !== 'object') {
            throw (0, errorUtils_1.createGeneratorError)(3002, 'Invalid configuration: must be an object', { config });
        }
        // Check if the framework is valid
        if (config.framework &&
            !['express', 'nestjs', 'fastify'].includes(config.framework)) {
            throw (0, errorUtils_1.createGeneratorError)(3003, `Invalid configuration: framework must be one of 'express', 'nestjs', or 'fastify'`, { framework: config.framework });
        }
        // Add more validation as needed
    }
    /**
     * Saves the current configuration to a file.
     * @param configPath Path to save the configuration to
     */
    async saveConfigFile(configPath) {
        try {
            // Create the directory if it doesn't exist
            const configDir = path.dirname(configPath);
            await fs.mkdir(configDir, { recursive: true });
            // Write the configuration to the file
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
        }
        catch (error) {
            throw (0, errorUtils_1.createGeneratorError)(3004, `Failed to save configuration file: ${configPath}`, { configPath }, error instanceof Error ? error : undefined);
        }
    }
    /**
     * Resets the configuration to the default values.
     */
    resetConfig() {
        this.config = this.getDefaultConfig();
    }
}
exports.ConfigManager = ConfigManager;
// Export a function to get the singleton instance
function getConfigManager() {
    return ConfigManager.getInstance();
}
//# sourceMappingURL=configManager.js.map