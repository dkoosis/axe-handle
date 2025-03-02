/**
 * Template Engine.
 * Handles the loading and rendering of EJS templates.
 */
export declare class TemplateEngine {
    private templateDir;
    private templates;
    private helpers;
    /**
     * Creates a new Template Engine.
     * @param templateDir Directory containing templates
     */
    constructor(templateDir: string);
    /**
     * Loads all templates from the template directory.
     */
    loadTemplates(): void;
    /**
     * Walks a directory recursively and calls the callback for each file.
     * @param dir Directory to walk
     * @param callback Callback to call for each file
     */
    private walkDir;
    /**
     * Registers a custom helper function.
     * @param name Name of the helper function
     * @param fn Helper function implementation
     */
    registerHelper(name: string, fn: Function): void;
    /**
     * Renders a template with the given data.
     * @param templateName Name of the template to render
     * @param data Data to pass to the template
     * @returns Rendered template output
     */
    renderTemplate(templateName: string, data: any): string;
    /**
     * Renders a template to a file.
     * @param templateName Name of the template to render
     * @param outputPath Path to output the rendered template
     * @param data Data to pass to the template
     */
    renderToFile(templateName: string, outputPath: string, data: any): void;
}
export default TemplateEngine;
