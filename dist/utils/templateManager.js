"use strict";
// Path: src/utils/templateManager.ts
// Provides a centralized template management system for the Axe Handle code generator.
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
exports.TemplateManager = exports.TemplateCategory = void 0;
exports.getTemplateManager = getTemplateManager;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const ejs = __importStar(require("ejs"));
const errorUtils_1 = require("./errorUtils");
/**
 * Template categories.
 */
var TemplateCategory;
(function (TemplateCategory) {
    TemplateCategory["SERVER"] = "server";
    TemplateCategory["HANDLER"] = "handler";
    TemplateCategory["TYPES"] = "types";
    TemplateCategory["INDEX"] = "index";
    TemplateCategory["API"] = "api";
    TemplateCategory["CONFIG"] = "config";
})(TemplateCategory || (exports.TemplateCategory = TemplateCategory = {}));
/**
 * Template Manager.
 * Responsible for managing templates, validating their existence,
 * and providing a unified interface for rendering templates.
 */
class TemplateManager {
    /**
     * Creates a new TemplateManager.
     * @param templatesDir Directory containing templates
     */
    constructor(templatesDir) {
        this.templateCache = new Map();
        this.templatesDir = templatesDir;
    }
    /**
     * Gets the singleton instance of the TemplateManager.
     * @param templatesDir Directory containing templates (optional, only used on first call)
     * @returns The TemplateManager instance
     */
    static getInstance(templatesDir) {
        if (!TemplateManager.instance) {
            if (!templatesDir) {
                throw new Error('templatesDir must be provided when creating the TemplateManager instance');
            }
            TemplateManager.instance = new TemplateManager(templatesDir);
        }
        return TemplateManager.instance;
    }
    /**
     * Gets the path to a template.
     * @param options Template path options
     * @returns The path to the template
     */
    getTemplatePath(options) {
        const { framework, category, name } = options;
        // Build framework-specific path if specified
        if (framework) {
            return path.join(this.templatesDir, framework, `${category}/${name}.ejs`);
        }
        // Build generic path
        return path.join(this.templatesDir, `${category}/${name}.ejs`);
    }
    /**
     * Validates that a template exists.
     * @param templatePath Path to the template
     * @returns Promise that resolves when the template is validated
     * @throws Error if the template does not exist
     */
    async validateTemplate(templatePath) {
        try {
            await fs.access(templatePath);
        }
        catch (error) {
            throw (0, errorUtils_1.createGeneratorError)(2001, `Template not found: ${templatePath}`, { templatePath }, error instanceof Error ? error : undefined);
        }
    }
    /**
     * Loads a template from the file system or cache.
     * @param templatePath Path to the template
     * @returns The template content
     */
    async loadTemplate(templatePath) {
        // Check if the template is in the cache
        if (this.templateCache.has(templatePath)) {
            return this.templateCache.get(templatePath);
        }
        // Validate that the template exists
        await this.validateTemplate(templatePath);
        // Load the template
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        // Cache the template
        this.templateCache.set(templatePath, templateContent);
        return templateContent;
    }
    /**
     * Renders a template with the given data.
     * @param templatePath Path to the template
     * @param data Data to render the template with
     * @returns The rendered template
     */
    async renderTemplate(templatePath, data) {
        try {
            // Load the template
            const templateContent = await this.loadTemplate(templatePath);
            // Render the template
            return await ejs.render(templateContent, data, { async: true });
        }
        catch (error) {
            throw (0, errorUtils_1.createGeneratorError)(2002, `Failed to render template: ${templatePath}`, { templatePath }, error instanceof Error ? error : undefined);
        }
    }
    /**
     * Renders a template and writes it to a file.
     * @param templatePath Path to the template
     * @param outputPath Path to output the rendered template
     * @param data Data to render the template with
     */
    async renderToFile(templatePath, outputPath, data) {
        try {
            // Create the directory if it doesn't exist
            const outputDir = path.dirname(outputPath);
            await fs.mkdir(outputDir, { recursive: true });
            // Render the template
            const renderedContent = await this.renderTemplate(templatePath, data);
            // Write the rendered content to the file
            await fs.writeFile(outputPath, renderedContent, 'utf-8');
        }
        catch (error) {
            throw (0, errorUtils_1.createGeneratorError)(2003, `Failed to render template to file: ${outputPath}`, { templatePath, outputPath }, error instanceof Error ? error : undefined);
        }
    }
    /**
     * Clears the template cache.
     */
    clearCache() {
        this.templateCache.clear();
    }
    /**
     * Gets a list of available templates for a given framework and category.
     * @param framework The framework to get templates for
     * @param category The category to get templates for
     * @returns A list of template names
     */
    async getAvailableTemplates(framework, category) {
        try {
            const templatesDir = path.join(this.templatesDir, framework, category);
            // Check if the directory exists
            try {
                await fs.access(templatesDir);
            }
            catch (error) {
                return []; // Directory doesn't exist, no templates available
            }
            // Get all files in the directory
            const files = await fs.readdir(templatesDir);
            // Filter out files that don't end with .ejs
            return files
                .filter(file => file.endsWith('.ejs'))
                .map(file => file.replace('.ejs', ''));
        }
        catch (error) {
            throw (0, errorUtils_1.createGeneratorError)(2004, `Failed to get available templates`, { framework, category }, error instanceof Error ? error : undefined);
        }
    }
}
exports.TemplateManager = TemplateManager;
// Export a function to get the singleton instance
function getTemplateManager(templatesDir) {
    return TemplateManager.getInstance(templatesDir);
}
//# sourceMappingURL=templateManager.js.map