/**
 * Template Engine.
 * Handles the loading and rendering of EJS templates.
 */
export default class TemplateEngine {
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
     * Find a file by name in a directory recursively.
     * @param dir Directory to search
     * @param filename Filename to find
     * @returns Array of matching file paths
     */
    private findFileInDir;
    /**
     * Renders a template to a file.
     * @param templateName Name of the template to render
     * @param outputPath Path to output the rendered template
     * @param data Data to pass to the template
     */
    renderToFile(templateName: string, outputPath: string, data: any): void;
    /**
     * Lists all templates that have been loaded.
     * @returns Array of template names
     */
    listLoadedTemplates(): string[];
}
