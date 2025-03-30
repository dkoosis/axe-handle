#!/bin/bash
set -e  # Exit on any error

echo "Reorganizing Axe Handle project structure..."

# Create the new directory structure
mkdir -p cmd/server
mkdir -p internal/mcp/resources
mkdir -p internal/mcp/tools
mkdir -p internal/mcp/prompts
mkdir -p internal/mcp/server/jsonrpc
mkdir -p internal/mcp/server/lifecycle
mkdir -p internal/mcp/server/transport
mkdir -p internal/providers/example
mkdir -p internal/providers/filesystem
mkdir -p pkg
mkdir -p test/unit
mkdir -p test/integration
mkdir -p test/conformance

# Move protocol definitions to internal/mcp
if [ -f internal/protocol/mcp.go ]; then
  mkdir -p internal/mcp/protocol
  mv internal/protocol/mcp.go internal/mcp/protocol/
fi

# Move transport implementations to internal/mcp/server/transport
if [ -d internal/transport ]; then
  cp internal/transport/transport.go internal/mcp/server/transport/
  cp internal/transport/stdio.go internal/mcp/server/transport/
  cp internal/transport/sse.go internal/mcp/server/transport/
fi

# Move server implementation to internal/mcp/server
if [ -f internal/server/server.go ]; then
  mv internal/server/server.go internal/mcp/server/
fi

if [ -f internal/server/handler.go ]; then
  mv internal/server/handler.go internal/mcp/server/jsonrpc/
fi

# Move tool-related code
if [ -d internal/handlers ]; then
  if [ -f internal/handlers/tools.go ]; then
    mkdir -p internal/mcp/tools/manager
    mv internal/handlers/tools.go internal/mcp/tools/manager/
  fi
fi

if [ -f internal/server/tools.go ]; then
  mkdir -p internal/mcp/tools/api
  mv internal/server/tools.go internal/mcp/tools/api/
fi

# Move main.go to cmd/server
if [ -f internal/server/main.go ]; then
  mv internal/server/main.go cmd/server/
fi

# Create initial interface files
cat > internal/mcp/resources/provider.go << 'EOF'
// internal/mcp/resources/provider.go
package resources

// Resource represents a resource that can be accessed by clients
type Resource struct {
	URI         string
	Name        string
	Description string
	MimeType    string
}

// Provider defines the interface for resource providers
type Provider interface {
	// ListResources returns a list of available resources
	ListResources() ([]Resource, error)
	
	// GetResource returns the content of a specific resource
	GetResource(uri string) (interface{}, error)
}
EOF

cat > internal/mcp/tools/provider.go << 'EOF'
// internal/mcp/tools/provider.go
package tools

// Tool represents a tool that can be called by clients
type Tool struct {
	Name        string
	Description string
	InputSchema interface{}
}

// Provider defines the interface for tool providers
type Provider interface {
	// ListTools returns a list of available tools
	ListTools() ([]Tool, error)
	
	// ExecuteTool executes a tool with the given arguments
	ExecuteTool(name string, args map[string]interface{}) (interface{}, error)
}
EOF

cat > internal/mcp/prompts/provider.go << 'EOF'
// internal/mcp/prompts/provider.go
package prompts

// Prompt represents a prompt template that can be used by clients
type Prompt struct {
	Name        string
	Description string
	Arguments   []PromptArgument
}

// PromptArgument represents an argument for a prompt
type PromptArgument struct {
	Name        string
	Description string
	Required    bool
}

// Provider defines the interface for prompt providers
type Provider interface {
	// ListPrompts returns a list of available prompts
	ListPrompts() ([]Prompt, error)
	
	// GetPrompt returns a prompt template with the given arguments
	GetPrompt(name string, args map[string]string) (interface{}, error)
}
EOF

# Create a basic README for each key directory
echo "Creating basic README files for key directories..."

cat > internal/mcp/README.md << 'EOF'
# MCP Domain

This package contains the core Model Context Protocol domain interfaces and implementations.

## Structure

- `resources`: Resource interfaces and implementations
- `tools`: Tool interfaces and implementations
- `prompts`: Prompt interfaces and implementations
- `server`: Protocol server implementation
- `protocol`: Protocol message definitions
EOF

cat > internal/providers/README.md << 'EOF'
# Providers

This package contains concrete implementations of the MCP domain interfaces.

## Implementations

- `example`: Example provider implementation
- `filesystem`: Filesystem provider implementation
EOF

# Cleanup vestigial directories after successfully moving their contents
echo "Cleaning up old directories..."

# Only remove directories if they're empty
cleanup_dir() {
  if [ -d "$1" ] && [ -z "$(ls -A "$1")" ]; then
    echo "Removing empty directory: $1"
    rmdir "$1"
  elif [ -d "$1" ]; then
    echo "Directory not empty, skipping: $1"
    echo "Contents: $(ls -A "$1")"
  fi
}

# Clean up old directories
if [ -d internal/protocol ]; then
  cleanup_dir internal/protocol
fi

if [ -d internal/transport ]; then
  cleanup_dir internal/transport
fi

if [ -d internal/handlers ]; then
  cleanup_dir internal/handlers
fi

if [ -d internal/server ]; then
  cleanup_dir internal/server
fi

echo "Reorganization complete!"