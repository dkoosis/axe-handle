"use strict";
// Path: src/generator/generator.ts
// Generates the TypeScript code for the MCP server based on the mapped service definition.
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
exports.generator = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ejs = __importStar(require("ejs"));
const types_1 = require("../types");
/**
 * Creates an AxeError specific to the generator.
 * @param code Numeric error code
 * @param message Error message
 * @param details Additional error details
 * @param cause Underlying error cause
 * @returns AxeError object
 */
function createGeneratorError(code, message, details, cause) {
    return {
        code: `${types_1.ErrorPrefix.AXE}-${types_1.AxeErrorCategory.GENERATOR}${String(code).padStart(3, '0')}`,
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
    constructor() {
        // Fix: Use the correct path.resolve to find the templates directory
        this.templatesDir = path.resolve(__dirname, '../../templates');
        console.log(`Generator initialized with templates directory: ${this.templatesDir}`);
    }
    /**
     * Gets the singleton instance of the Generator.
     * @returns The Generator instance
     */
    static getInstance() {
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
    async generateServer(mappedService, options) {
        try {
            console.log(`Starting code generation for service: ${mappedService.name}`);
            console.log(`Templates directory: ${this.templatesDir}`);
            // Check if templates directory exists
            try {
                await fs.access(this.templatesDir);
                console.log(`Templates directory exists: ${this.templatesDir}`);
                // List directory contents to debug
                const templateFiles = await fs.readdir(this.templatesDir);
                console.log(`Template directory contents: ${templateFiles.join(', ')}`);
            }
            catch (error) {
                console.error(`Templates directory not found: ${this.templatesDir}`);
                throw createGeneratorError(1, `Templates directory not found: ${this.templatesDir}`, { templatesDir: this.templatesDir }, error instanceof Error ? error : new Error(String(error)));
            }
            // Create output directory if it doesn't exist
            await fs.mkdir(options.outputDir, { recursive: true });
            console.log(`Output directory created/verified: ${options.outputDir}`);
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
            console.log(`Code generation completed for service: ${mappedService.name}`);
        }
        catch (error) {
            console.error(`Error generating server code: ${error instanceof Error ? error.message : String(error)}`);
            if (error instanceof Error && 'code' in error) {
                // Error is already an AxeError, rethrow
                throw error;
            }
            throw createGeneratorError(1, 'Failed to generate server code', { serviceName: mappedService.name }, error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Generates the types file.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    async generateTypesFile(mappedService, options) {
        try {
            console.log('Generating types file...');
            // First, look for the template in the templates directory
            let templatePath = path.join(this.templatesDir, 'types.ejs');
            // Check if the template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                // If not found, try in express/types directory
                templatePath = path.join(this.templatesDir, 'express', 'types', 'types.ejs');
                try {
                    await fs.access(templatePath);
                }
                catch (innerError) {
                    throw createGeneratorError(2, 'Types template not found', {
                        triedPaths: [
                            path.join(this.templatesDir, 'types.ejs'),
                            path.join(this.templatesDir, 'express', 'types', 'types.ejs')
                        ]
                    }, innerError instanceof Error ? innerError : new Error(String(innerError)));
                }
            }
            // Read template
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            console.log(`Types template loaded from: ${templatePath}`);
            // Generate types
            const typesContent = ejs.render(templateContent, {
                service: mappedService,
                date: new Date().toISOString(),
                version: '0.1.0'
            });
            // Write types file
            const typesPath = path.join(options.outputDir, 'types.ts');
            await fs.writeFile(typesPath, typesContent, 'utf-8');
            console.log(`Generated types file: ${typesPath}`);
        }
        catch (error) {
            console.error(`Error generating types file: ${error instanceof Error ? error.message : String(error)}`);
            throw createGeneratorError(3, 'Failed to generate types file', { serviceName: mappedService.name }, error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Generates handler files for each resource.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    async generateHandlerFiles(mappedService, options) {
        try {
            console.log('Generating handler files...');
            const handlersDir = path.join(options.outputDir, 'handlers');
            await fs.mkdir(handlersDir, { recursive: true });
            // First, look for the template in the templates directory
            let templatePath = path.join(this.templatesDir, 'handler.ejs');
            // Check if the template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                // If not found, try in express/handler directory
                templatePath = path.join(this.templatesDir, 'express', 'handler', 'handler.ejs');
                try {
                    await fs.access(templatePath);
                }
                catch (innerError) {
                    throw createGeneratorError(4, 'Handler template not found', {
                        triedPaths: [
                            path.join(this.templatesDir, 'handler.ejs'),
                            path.join(this.templatesDir, 'express', 'handler', 'handler.ejs')
                        ]
                    }, innerError instanceof Error ? innerError : new Error(String(innerError)));
                }
            }
            // Read template
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            console.log(`Handler template loaded from: ${templatePath}`);
            // Generate handler files for each resource
            for (const resource of mappedService.resources) {
                const handlerContent = ejs.render(templateContent, {
                    service: mappedService,
                    resource,
                    date: new Date().toISOString(),
                    version: '0.1.0'
                });
                // Convert resource name to kebab-case for filename
                const kebabCase = this.camelToKebabCase(resource.name);
                const handlerPath = path.join(handlersDir, `${kebabCase}.ts`);
                await fs.writeFile(handlerPath, handlerContent, 'utf-8');
                console.log(`Generated handler file: ${handlerPath}`);
            }
        }
        catch (error) {
            console.error(`Error generating handler files: ${error instanceof Error ? error.message : String(error)}`);
            throw createGeneratorError(5, 'Failed to generate handler files', { serviceName: mappedService.name }, error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Generates the server file.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    async generateServerFile(mappedService, options) {
        try {
            console.log('Generating server file...');
            // First, look for the template in the templates directory
            let templatePath = path.join(this.templatesDir, 'server.ejs');
            // Check if the template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                // If not found, try in express/server directory
                templatePath = path.join(this.templatesDir, 'express', 'server', 'server.ejs');
                try {
                    await fs.access(templatePath);
                }
                catch (innerError) {
                    throw createGeneratorError(6, 'Server template not found', {
                        triedPaths: [
                            path.join(this.templatesDir, 'server.ejs'),
                            path.join(this.templatesDir, 'express', 'server', 'server.ejs')
                        ]
                    }, innerError instanceof Error ? innerError : new Error(String(innerError)));
                }
            }
            // Read template
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            console.log(`Server template loaded from: ${templatePath}`);
            // Generate server
            const serverContent = ejs.render(templateContent, {
                service: mappedService,
                date: new Date().toISOString(),
                version: '0.1.0'
            });
            // Write server file
            const serverPath = path.join(options.outputDir, 'server.ts');
            await fs.writeFile(serverPath, serverContent, 'utf-8');
            console.log(`Generated server file: ${serverPath}`);
        }
        catch (error) {
            console.error(`Error generating server file: ${error instanceof Error ? error.message : String(error)}`);
            throw createGeneratorError(7, 'Failed to generate server file', { serviceName: mappedService.name }, error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Generates the index file.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    async generateIndexFile(mappedService, options) {
        try {
            console.log('Generating index file...');
            // First, look for the template in the templates directory
            let templatePath = path.join(this.templatesDir, 'index.ejs');
            // Check if the template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                // If not found, try in express/index directory
                templatePath = path.join(this.templatesDir, 'express', 'index', 'index.ejs');
                try {
                    await fs.access(templatePath);
                }
                catch (innerError) {
                    throw createGeneratorError(8, 'Index template not found', {
                        triedPaths: [
                            path.join(this.templatesDir, 'index.ejs'),
                            path.join(this.templatesDir, 'express', 'index', 'index.ejs')
                        ]
                    }, innerError instanceof Error ? innerError : new Error(String(innerError)));
                }
            }
            // Read template
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            console.log(`Index template loaded from: ${templatePath}`);
            // Generate index
            const indexContent = ejs.render(templateContent, {
                service: mappedService,
                date: new Date().toISOString(),
                version: '0.1.0'
            });
            // Write index file
            const indexPath = path.join(options.outputDir, 'index.ts');
            await fs.writeFile(indexPath, indexContent, 'utf-8');
            console.log(`Generated index file: ${indexPath}`);
        }
        catch (error) {
            console.error(`Error generating index file: ${error instanceof Error ? error.message : String(error)}`);
            throw createGeneratorError(9, 'Failed to generate index file', { serviceName: mappedService.name }, error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Generates documentation.
     * @param mappedService The mapped service
     * @param options Generator options
     */
    async generateDocumentation(mappedService, options) {
        try {
            console.log('Generating documentation...');
            const docsDir = path.join(options.outputDir, 'docs');
            await fs.mkdir(docsDir, { recursive: true });
            // First, look for the template in the templates directory
            let templatePath = path.join(this.templatesDir, 'api.ejs');
            // Check if the template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                // If not found, try in express/api directory
                templatePath = path.join(this.templatesDir, 'express', 'api', 'api.ejs');
                try {
                    await fs.access(templatePath);
                }
                catch (innerError) {
                    throw createGeneratorError(10, 'API documentation template not found', {
                        triedPaths: [
                            path.join(this.templatesDir, 'api.ejs'),
                            path.join(this.templatesDir, 'express', 'api', 'api.ejs')
                        ]
                    }, innerError instanceof Error ? innerError : new Error(String(innerError)));
                }
            }
            // Read template
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            console.log(`API template loaded from: ${templatePath}`);
            // Generate API documentation
            const apiContent = ejs.render(templateContent, {
                service: mappedService,
                date: new Date().toISOString(),
                version: '0.1.0'
            });
            // Write API documentation file
            const apiPath = path.join(docsDir, 'api.md');
            await fs.writeFile(apiPath, apiContent, 'utf-8');
            console.log(`Generated API documentation: ${apiPath}`);
        }
        catch (error) {
            console.error(`Error generating documentation: ${error instanceof Error ? error.message : String(error)}`);
            throw createGeneratorError(11, 'Failed to generate documentation', { serviceName: mappedService.name }, error instanceof Error ? error : new Error(String(error)));
        }
    }
    /**
     * Converts a camelCase string to kebab-case.
     * @param str The string to convert
     * @returns The converted string
     */
    camelToKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .toLowerCase();
    }
}
// Export the singleton instance
exports.generator = Generator.getInstance();
//# sourceMappingURL=generator.js.map