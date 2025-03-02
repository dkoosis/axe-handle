import ts from 'typescript';

/**
 * Extracts JSDoc comments from a TypeScript node. Handles both single-line
 * JSDoc tags and multi-line block comments.
 *
 * @param node The TypeScript AST node.
 * @param sourceFile The source file object for getting node positions.
 * @returns The JSDoc comment string, or undefined if no comment is found.
 */
function getJSDocComment(node: ts.Node, sourceFile: ts.SourceFile): string | undefined {
  try {
    const jsDocTags = ts.getJSDocTags(node);
    if (jsDocTags && jsDocTags.length > 0) {
      // Process JSDoc tags (usually single-line)
      const comments = jsDocTags
        .map((tag) => {
          if (tag.comment) {
            return typeof tag.comment === 'string'
              ? tag.comment
              : tag.comment.map((part) => part.text || '').join('');
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
          .map((line) => line.replace(/^\s*\*\s?/, ''))
          .join('\n')
          .trim();
      }
      return undefined;
    }
  } catch (error) {
    console.warn(
      `Warning: Error extracting JSDoc for ${node.getText ? node.getText().slice(0, 20) : 'unknown node'}`,
    );
    return undefined;
  }
}

/**
 * Extracts MCP-specific tags (e.g., @mcp-resource) from a TypeScript node's JSDoc.
 *
 * @param node The TypeScript AST node.
 * @returns An object with boolean properties for each MCP tag (resource, tool, prompt, capability).
 */
function getMCPTags(node: ts.Node): {
  resource?: boolean;
  tool?: boolean;
  prompt?: boolean;
  capability?: boolean;
} {
  try {
    const jsDocTags = ts.getJSDocTags(node);
    if (!jsDocTags) return {};

    const mcpTags: {
      resource?: boolean;
      tool?: boolean;
      prompt?: boolean;
      capability?: boolean;
    } = {};

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
 *
 * @param typeNode The TypeScript type node.
 * @returns The string representation of the type.
 */
function typeToString(typeNode: ts.TypeNode): string {
  if (!typeNode) return 'any';
  return typeNode.getText();
}

/**
 * Converts a camelCase or PascalCase string to kebab-case.
 *
 * @param str The input string.
 * @returns The kebab-case version of the string.
 */
function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export { getJSDocComment, getMCPTags, typeToString, kebabCase };