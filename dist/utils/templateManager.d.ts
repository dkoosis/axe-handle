/**
 * Available template frameworks.
 */
export type TemplateFramework = 'express' | 'nestjs' | 'fastify';
/**
 * Template categories.
 */
export declare enum TemplateCategory {
    SERVER = "server",
    HANDLER = "handler",
    TYPES = "types",
    INDEX = "index",
    API = "api",
    CONFIG = "config"
}
/**
 * Template path resolution options.
 */
export interface TemplatePathOptions {
    framework: TemplateFramework;
    category: TemplateCategory;
    name: string;
}
/**
 * Template Manager.
 * Responsible for managing templates, validating their existence,
 * and providing a unified interface for rendering templates.
 */
export declare class TemplateManager {
    private static instance;
    private templatesDir;
    private templateCache;
    /**
     * Creates a new TemplateManager.
     * @param templatesDir Directory containing templates
     */
    private constructor();
    /**
     * Gets the singleton instance of the TemplateManager.
     * @param templatesDir Directory containing templates (optional, only used on first call)
     * @returns The TemplateManager instance
     */
    static getInstance(templatesDir?: string): TemplateManager;
    /**
     * Gets the path to a template.
     * @param options Template path options
     * @returns The path to the template
     */
    getTemplatePath(options: TemplatePathOptions): string;
    /**
     * Validates that a template exists.
     * @param templatePath Path to the template
     * @returns Promise that resolves when the template is validated
     * @throws Error if the template does not exist
     */
    validateTemplate(templatePath: string): Promise<void>;
    /**
     * Loads a template from the file system or cache.
     * @param templatePath Path to the template
     * @returns The template content
     */
    loadTemplate(templatePath: string): Promise<string>;
    /**
     * Renders a template with the given data.
     * @param templatePath Path to the template
     * @param data Data to render the template with
     * @returns The rendered template
     */
    renderTemplate(templatePath: string, data: any): Promise<string>;
    /**
     * Renders a template and writes it to a file.
     * @param templatePath Path to the template
     * @param outputPath Path to output the rendered template
     * @param data Data to render the template with
     */
    renderToFile(templatePath: string, outputPath: string, data: any): Promise<void>;
    /**
     * Clears the template cache.
     */
    clearCache(): void;
    /**
     * Gets a list of available templates for a given framework and category.
     * @param framework The framework to get templates for
     * @param category The category to get templates for
     * @returns A list of template names
     */
    getAvailableTemplates(framework: TemplateFramework, category: TemplateCategory): Promise<string[]>;
}
export declare function getTemplateManager(templatesDir?: string): TemplateManager;
