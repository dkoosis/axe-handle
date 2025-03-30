// internal/mcp/server/provider/registry.go
package provider

import (
	"context"
	"sync"

	"github.com/dkoosis/axe-handle/internal/mcp/prompts"
	"github.com/dkoosis/axe-handle/internal/mcp/resources"
	"github.com/dkoosis/axe-handle/internal/mcp/tools"
)

// Registry manages all MCP providers
type Registry struct {
	resourceProviders []resources.Provider
	toolProviders     []tools.Provider
	promptProviders   []prompts.Provider
	mu                sync.RWMutex
}

// NewRegistry creates a new provider registry
func NewRegistry() *Registry {
	return &Registry{
		resourceProviders: []resources.Provider{},
		toolProviders:     []tools.Provider{},
		promptProviders:   []prompts.Provider{},
	}
}

// RegisterResourceProvider adds a resource provider to the registry
func (r *Registry) RegisterResourceProvider(provider resources.Provider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.resourceProviders = append(r.resourceProviders, provider)
}

// RegisterToolProvider adds a tool provider to the registry
func (r *Registry) RegisterToolProvider(provider tools.Provider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.toolProviders = append(r.toolProviders, provider)
}

// RegisterPromptProvider adds a prompt provider to the registry
func (r *Registry) RegisterPromptProvider(provider prompts.Provider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.promptProviders = append(r.promptProviders, provider)
}

// ListResources aggregates resources from all registered resource providers
func (r *Registry) ListResources(ctx context.Context) ([]resources.Resource, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var allResources []resources.Resource
	for _, provider := range r.resourceProviders {
		resources, err := provider.ListResources()
		if err != nil {
			return nil, err
		}
		allResources = append(allResources, resources...)
	}
	return allResources, nil
}

// GetResource retrieves a resource from the appropriate provider
func (r *Registry) GetResource(ctx context.Context, uri string) (interface{}, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, provider := range r.resourceProviders {
		resource, err := provider.GetResource(uri)
		if err == nil {
			return resource, nil
		}
		// If provider returns error, try the next one
	}
	return nil, resources.ErrResourceNotFound
}

// ListTools aggregates tools from all registered tool providers
func (r *Registry) ListTools(ctx context.Context) ([]tools.Tool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var allTools []tools.Tool
	for _, provider := range r.toolProviders {
		tools, err := provider.ListTools()
		if err != nil {
			return nil, err
		}
		allTools = append(allTools, tools...)
	}
	return allTools, nil
}

// ExecuteTool executes a tool using the appropriate provider
func (r *Registry) ExecuteTool(ctx context.Context, name string, args map[string]interface{}) (interface{}, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, provider := range r.toolProviders {
		// Each provider should return an error if it doesn't have the tool
		result, err := provider.ExecuteTool(name, args)
		if err == nil {
			return result, nil
		}
		// If provider returns error, try the next one
	}
	return nil, tools.ErrToolNotFound
}

// ListPrompts aggregates prompts from all registered prompt providers
func (r *Registry) ListPrompts(ctx context.Context) ([]prompts.Prompt, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var allPrompts []prompts.Prompt
	for _, provider := range r.promptProviders {
		prompts, err := provider.ListPrompts()
		if err != nil {
			return nil, err
		}
		allPrompts = append(allPrompts, prompts...)
	}
	return allPrompts, nil
}

// GetPrompt retrieves a prompt from the appropriate provider
func (r *Registry) GetPrompt(ctx context.Context, name string, args map[string]string) (interface{}, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, provider := range r.promptProviders {
		prompt, err := provider.GetPrompt(name, args)
		if err == nil {
			return prompt, nil
		}
		// If provider returns error, try the next one
	}
	return nil, prompts.ErrPromptNotFound
}
