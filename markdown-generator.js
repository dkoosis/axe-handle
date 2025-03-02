// markdown-generator.js
/**
 * Generate markdown documentation from a parsed MCP schema
 */
function generateMarkdown(schema) {
    let md = `# MCP Schema Documentation\n\n`;
    md += `Protocol Version: ${schema.version}\n\n`;
    md += `## Summary\n\n`;
    md += `- Interfaces: ${schema.summary.interfaceCount}\n`;
    md += `- Type Aliases: ${schema.summary.typeCount}\n`;
    md += `- Constants: ${schema.summary.constantCount}\n`;
    md += `- MCP Resources: ${schema.summary.resourceCount}\n`;
    md += `- MCP Tools: ${schema.summary.toolCount}\n`;
    md += `- MCP Prompts: ${schema.summary.promptCount}\n\n`;

    // Document constants
    md += `## Constants\n\n`;
    md += `| Name | Value |\n`;
    md += `|------|-------|\n`;

    Object.entries(schema.constants)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([name, value]) => {
            md += `| \`${name}\` | \`${value}\` |\n`;
        });

    md += `\n`;

    // Document MCP Resources, Tools, and Prompts
    ['Resources', 'Tools', 'Prompts'].forEach(category => {
        const mcpCategory = schema.mcp[category.toLowerCase()];
        if (mcpCategory.length > 0) {
            md += `## MCP ${category}\n\n`;
            mcpCategory.forEach(name => {
                const item = schema.interfaces[name] || schema.types[name];
                if (!item) return;

                md += `### ${name}\n\n`;
                if (item.description) {
                    md += `${item.description}\n\n`;
                }
                if (item.extends) {
                    md += `*Extends: ${item.extends.join(', ')}*\n\n`;
                }
                if (item.properties) {
                    md += generatePropertyTable(item.properties);
                }
            });
        }
    });
    
    // document capabilities
    if (schema.mcp.capabilities.length > 0) {
      md += `## MCP Capabilities\n\n`;
      schema.mcp.capabilities.forEach(name => {
        const item = schema.interfaces[name] || schema.types[name];
        if (!item) return;

        md += `### ${name}\n\n`;
        if (item.description) {
          md += `${item.description}\n\n`;
        }
        if (item.extends) {
          md += `*Extends: ${item.extends.join(', ')}*\n\n`;
        }
        if (item.properties) {
          md += generatePropertyTable(item.properties);
        }
      });
    }

    // Document remaining type aliases
    md += `## Type Aliases\n\n`;
    Object.values(schema.types)
        .filter(type => !isMCPComponent(type.name, schema))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(type => {
            md += `### ${type.name}\n\n`;
            if (type.description) {
                md += `${type.description}\n\n`;
            }
            md += `\`\`\`typescript\ntype ${type.name} = ${type.type};\n\`\`\`\n\n`;
        });
    
    // Document remaining interfaces
      md += `## Interfaces\n\n`;
      Object.values(schema.interfaces)
          .filter(iface => !isMCPComponent(iface.name, schema))
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

function generatePropertyTable(properties) {
    let md = `| Property | Type | Optional | Description |\n`;
    md += `|----------|------|----------|-------------|\n`;
    properties.forEach(prop => {
        const description = prop.description ? prop.description.split('\n')[0] : '';
        md += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'Yes' : 'No'} | ${description} |\n`;
    });
    md += `\n`;
    return md;
}

function isMCPComponent(name, schema) {
    return schema.mcp.resources.includes(name) ||
           schema.mcp.tools.includes(name) ||
           schema.mcp.prompts.includes(name) ||
           schema.mcp.capabilities.includes(name);
}

module.exports = { generateMarkdown };