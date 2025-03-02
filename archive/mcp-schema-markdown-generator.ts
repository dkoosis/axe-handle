// axe-handle/mcp-schema-markdown-generator.ts

/**
 * Generates markdown documentation from a parsed MCP schema.
 * @path axe-handle/mcp-schema-markdown-generator.ts
 * @param schema The parsed MCP schema.
 * @returns A string containing the generated markdown documentation.
 */
function generateMcpSchemaMarkdown(schema: McpSchema): string {
    let markdown = `# MCP Schema Documentation\n\n`;
    markdown += `Protocol Version: ${schema.version}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `- Interfaces: ${schema.summary.interfaceCount}\n`;
    markdown += `- Type Aliases: ${schema.summary.typeCount}\n`;
    markdown += `- Constants: ${schema.summary.constantCount}\n`;
    markdown += `- MCP Resources: ${schema.summary.resourceCount}\n`;
    markdown += `- MCP Tools: ${schema.summary.toolCount}\n`;
    markdown += `- MCP Prompts: ${schema.summary.promptCount}\n\n`;
  
    markdown += generateConstantsTable(schema.constants);
    markdown += generateMcpSection(schema, 'Resources');
    markdown += generateMcpSection(schema, 'Tools');
    markdown += generateMcpSection(schema, 'Prompts');
    markdown += generateMcpSection(schema, 'Capabilities');
    markdown += generateTypeAliasesSection(schema);
    markdown += generateInterfacesSection(schema);
  
    return markdown;
  }
  
  /**
   * Generates a markdown table of constants.
   * @param constants An object containing constant names and values.
   * @returns Markdown string for the constants table.
   */
  function generateConstantsTable(constants: Record<string, string | number>): string {
    let markdown = `## Constants\n\n`;
    markdown += `| Name | Value |\n`;
    markdown += `|------|-------|\n`;
  
    Object.entries(constants)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([name, value]) => {
        markdown += `| \`${name}\` | \`${value}\` |\n`;
      });
  
    markdown += `\n`;
    return markdown;
  }
  
  /**
   * Generates a markdown section for MCP components (Resources, Tools, Prompts, Capabilities).
   * @param schema The parsed MCP schema.
   * @param category The MCP component category ('Resources', 'Tools', 'Prompts', 'Capabilities').
   * @returns Markdown string for the MCP component section.
   */
  function generateMcpSection(schema: McpSchema, category: McpCategory): string {
    const mcpCategory = schema.mcp[category.toLowerCase() as Lowercase<McpCategory>];
    if (!mcpCategory || mcpCategory.length === 0) {
      return '';
    }
  
    let markdown = `## MCP ${category}\n\n`;
    mcpCategory.forEach((name: string) => {
      const item = schema.interfaces[name] || schema.types[name];
      if (!item) return;
  
      markdown += `### ${name}\n\n`;
      if (item.description) {
        markdown += `${item.description}\n\n`;
      }
      if (item.extends) {
        markdown += `*Extends: ${item.extends.join(', ')}*\n\n`;
      }
      if ('properties' in item && item.properties) {
        markdown += generatePropertyTable(item.properties);
      }
    });
  
    return markdown;
  }
  
  /**
   * Generates a markdown section for type aliases.
   * @param schema The parsed MCP schema.
   * @returns Markdown string for the type aliases section.
   */
  function generateTypeAliasesSection(schema: McpSchema): string {
      let md = `## Type Aliases\n\n`;
      Object.values(schema.types)
          .filter(type => !isMcpComponent(type.name, schema))
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(type => {
              md += `### ${type.name}\n\n`;
              if (type.description) {
                  md += `${type.description}\n\n`;
              }
              md += `\`\`\`typescript\ntype ${type.name} = ${type.type};\n\`\`\`\n\n`;
          });
      return md;
  }
  
  /**
     * Generates a markdown section for interfaces, excluding MCP components.
     * @param schema - The parsed MCP schema.
     * @returns - Markdown string for interfaces section.
     */
  function generateInterfacesSection(schema: McpSchema): string {
    let md = `## Interfaces\n\n`;
      Object.values(schema.interfaces)
      .filter(iface => !isMcpComponent(iface.name, schema))
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach(iface => {
              md += `### ${iface.name}\n\n`;
              if (iface.description) {
                  md += `${iface.description}\n\n`;
              }
              if (iface.extends) {
                  md += `*Extends: ${iface.extends.join(', ')}*\n\n`;
              }
              if (iface.properties && iface.properties.length > 0) {
                  md += generatePropertyTable(iface.properties);
              } else {
                  md += `*No properties*\n\n`;
              }
          });
    return md;
  }
  
  /**
   * Generates a markdown table for properties.
   * @param properties An array of property objects.
   * @returns Markdown string for the property table.
   */
  function generatePropertyTable(properties: Property[]): string {
    let markdown = `| Property | Type | Optional | Description |\n`;
    markdown += `|----------|------|----------|-------------|\n`;
    properties.forEach((property) => {
      const description = property.description ? property.description.split('\n')[0] : '';
      markdown += `| \`${property.name}\` | \`${property.type}\` | ${property.isOptional ? 'Yes' : 'No'} | ${description} |\n`;
    });
    markdown += `\n`;
    return markdown;
  }
  
  /**
   * Checks if a given name is an MCP component (Resource, Tool, Prompt, or Capability).
   * @param name The name to check.
   * @param schema The parsed MCP schema.
   * @returns True if the name is an MCP component, false otherwise.
   */
  function isMcpComponent(name: string, schema: McpSchema): boolean {
    return (
      schema.mcp.resources.includes(name) ||
      schema.mcp.tools.includes(name) ||
      schema.mcp.prompts.includes(name) ||
      schema.mcp.capabilities.includes(name)
    );
  }
  
  // --- Type Definitions ---
  
  /**
   * Represents the entire MCP schema.
   */
  interface McpSchema {
    version: string;
    summary: Summary;
    constants: Record<string, string | number>;
    types: Record<string, TypeAlias>;
    interfaces: Record<string, Interface>;
    mcp: McpComponents;
  }
  
  /**
   * Represents the summary section of the MCP schema.
   */
  interface Summary {
    interfaceCount: number;
    typeCount: number;
    constantCount: number;
    resourceCount: number;
    toolCount: number;
    promptCount: number;
  }
  
  /**
   * Represents a type alias in the MCP schema.
   */
  interface TypeAlias {
    name: string;
    description?: string;
    type: string;
    extends?: string[];
  }
  
  /**
   * Represents an interface in the MCP schema.
   */
  interface Interface {
    name: string;
    description?: string;
    extends?: string[];
    properties?: Property[];
  }
  
  /**
   * Represents a property within an interface.
   */
  interface Property {
    name: string;
    type: string;
    isOptional: boolean;
    description?: string;
  }
  
  /**
   *  Mcp Component categories
   */
  type McpCategory = 'Resources' | 'Tools' | 'Prompts' | 'Capabilities';
  
  /**
   * Represents the MCP components section of the schema.
   */
  interface McpComponents {
    resources: string[];
    tools: string[];
    prompts: string[];
    capabilities: string[];
  }
  
  export { generateMcpSchemaMarkdown };