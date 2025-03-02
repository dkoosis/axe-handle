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
        this.templatesDir = path.resolve(__dirname, '../../../templates');
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
        }
        catch (error) {
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
            const templatePath = path.join(this.templatesDir, 'types.ejs');
            // Ensure template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                throw createGeneratorError(2, 'Types template not found', { templatePath }, error instanceof Error ? error : undefined);
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
        }
        catch (error) {
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
            const handlersDir = path.join(options.outputDir, 'handlers');
            await fs.mkdir(handlersDir, { recursive: true });
            const templatePath = path.join(this.templatesDir, 'handler.ejs');
            // Ensure template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                throw createGeneratorError(4, 'Handler template not found', { templatePath }, error instanceof Error ? error : undefined);
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
        }
        catch (error) {
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
            const templatePath = path.join(this.templatesDir, 'server.ejs');
            // Ensure template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                throw createGeneratorError(6, 'Server template not found', { templatePath }, error instanceof Error ? error : undefined);
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
        }
        catch (error) {
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
            const templatePath = path.join(this.templatesDir, 'index.ejs');
            // Ensure template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                throw createGeneratorError(8, 'Index template not found', { templatePath }, error instanceof Error ? error : undefined);
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
        }
        catch (error) {
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
            const docsDir = path.join(options.outputDir, 'docs');
            await fs.mkdir(docsDir, { recursive: true });
            const templatePath = path.join(this.templatesDir, 'api.ejs');
            // Ensure template exists
            try {
                await fs.access(templatePath);
            }
            catch (error) {
                throw createGeneratorError(10, 'API documentation template not found', { templatePath }, error instanceof Error ? error : undefined);
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
        }
        catch (error) {
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