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
