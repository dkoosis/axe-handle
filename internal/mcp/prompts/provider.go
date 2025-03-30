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
