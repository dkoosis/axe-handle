// internal/providers/example/example.go
package example

import (
	"github.com/dkoosis/axe-handle/internal/mcp/prompts"
	"github.com/dkoosis/axe-handle/internal/mcp/resources"
	"github.com/dkoosis/axe-handle/internal/mcp/tools"
)

// Provider implements all three provider interfaces
type Provider struct {
	// Any provider-specific state
}

// NewProvider creates a new example provider
func NewProvider() *Provider {
	return &Provider{}
}

// Ensure Provider implements all the interfaces
var (
	_ resources.Provider = (*Provider)(nil)
	_ tools.Provider     = (*Provider)(nil)
	_ prompts.Provider   = (*Provider)(nil)
)

// ListResources returns a list of example resources
func (p *Provider) ListResources() ([]resources.Resource, error) {
	return []resources.Resource{
		{
			URI:         "example://hello",
			Name:        "Hello Resource",
			Description: "A simple example resource",
			MimeType:    "text/plain",
		},
	}, nil
}

// GetResource returns the content of an example resource
func (p *Provider) GetResource(uri string) (interface{}, error) {
	if uri == "example://hello" {
		return "Hello, world! This is an example resource.", nil
	}
	return nil, resources.ErrResourceNotFound
}

// ListTools returns a list of example tools
func (p *Provider) ListTools() ([]tools.Tool, error) {
	return []tools.Tool{
		{
			Name:        "echo",
			Description: "Echoes back the input",
			InputSchema: map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"message": map[string]interface{}{
						"type": "string",
					},
				},
				"required": []string{"message"},
			},
		},
	}, nil
}

// ExecuteTool executes an example tool
func (p *Provider) ExecuteTool(name string, args map[string]interface{}) (interface{}, error) {
	if name == "echo" {
		message, ok := args["message"].(string)
		if !ok {
			return nil, tools.ErrInvalidToolArguments
		}
		return map[string]interface{}{
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": message,
				},
			},
		}, nil
	}
	return nil, tools.ErrToolNotFound
}

// ListPrompts returns a list of example prompts
func (p *Provider) ListPrompts() ([]prompts.Prompt, error) {
	return []prompts.Prompt{
		{
			Name:        "greeting",
			Description: "A friendly greeting prompt",
			Arguments: []prompts.PromptArgument{
				{
					Name:        "name",
					Description: "The name to greet",
					Required:    true,
				},
			},
		},
	}, nil
}

// GetPrompt returns an example prompt
func (p *Provider) GetPrompt(name string, args map[string]string) (interface{}, error) {
	if name == "greeting" {
		recipientName, ok := args["name"]
		if !ok {
			recipientName = "World"
		}
		return map[string]interface{}{
			"messages": []map[string]interface{}{
				{
					"role": "user",
					"content": map[string]interface{}{
						"type": "text",
						"text": "Hello, " + recipientName + "! How are you today?",
					},
				},
			},
		}, nil
	}
	return nil, prompts.ErrPromptNotFound
}
