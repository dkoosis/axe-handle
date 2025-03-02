// utils.js
const ts = require('typescript');

/**
 * Extracts JSDoc comments from a TypeScript node.  Handles both single-line
 * JSDoc tags and multi-line block comments.
 * @param {ts.Node} node The TypeScript AST node.
 * @param {ts.SourceFile} sourceFile The source file object for getting node positions.
 * @returns {string | undefined} The JSDoc comment string, or undefined if no comment is found.
 */
function getJSDocComment(node, sourceFile) {
    try {
        const jsDocTags = ts.getJSDocTags(node);
        if (jsDocTags && jsDocTags.length > 0) {
            // Process JSDoc tags (usually single-line)
            const comments = jsDocTags
                .map(tag => {
                    if (tag.comment) {
                        return typeof tag.comment === 'string' ?
                            tag.comment :
                            tag.comment.map(part => part.text || '').join('');
                    }

                    if (tag.tagName && tag.tagName.escapedText) {
                        return `@${tag.tagName.escapedText}`;
                    }

                    return '';
                })
                .join('\n');

            return comments || undefined;
        } else {
            // Check for full JSDoc comments (multi-line block comments)
            const nodePos = node.getFullStart();
            const nodeText = sourceFile.getFullText();
            const textBefore = nodeText.substring(0, nodePos);

            // Look for JSDoc comment before the node
            const jsDocMatch = textBefore.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/);
            if (jsDocMatch) {
                return jsDocMatch[1]
                    .split('\n')
                    .map(line => line.replace(/^\s*\*\s?/, ''))
                    .join('\n')
                    .trim();
            }
            return undefined;
        }
    } catch (error) {
        console.warn(`Warning: Error extracting JSDoc for ${node.getText ? node.getText().slice(0, 20) : 'unknown node'}`);
        return undefined;
    }
}

/**
 * Extracts MCP-specific tags (e.g., @mcp-resource) from a TypeScript node's JSDoc.
 * @param {ts.Node} node The TypeScript AST node.
 * @returns {object} An object with boolean properties for each MCP tag (resource, tool, prompt, capability).
 */
function getMCPTags(node) {
    try {
        const jsDocTags = ts.getJSDocTags(node);
        if (!jsDocTags) return {};

        const mcpTags = {};

        for (const tag of jsDocTags) {
            if (tag.tagName && tag.tagName.escapedText) {
                const tagName = tag.tagName.escapedText;
                if (tagName === 'mcp-resource') mcpTags.resource = true;
                if (tagName === 'mcp-tool') mcpTags.tool = true;
                if (tagName === 'mcp-prompt') mcpTags.prompt = true;
                if (tagName === 'mcp-capability') mcpTags.capability = true;
            }
        }

        return mcpTags;
    } catch (error) {
        console.warn(`Warning: Error extracting MCP tags`);
        return {};
    }
}
/**
 * Converts a TypeScript type node to its string representation.
 * @param {ts.TypeNode} typeNode The TypeScript type node.
 * @returns {string} The string representation of the type.
 */
function typeToString(typeNode) {
    if (!typeNode) return 'any';
    return typeNode.getText();
}

/**
 * Converts a camelCase or PascalCase string to kebab-case.
 * @param {string} str The input string.
 * @returns {string} The kebab-case version of the string.
 */
function kebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}



module.exports = {
    getJSDocComment,
    getMCPTags,
    typeToString,
    kebabCase
};