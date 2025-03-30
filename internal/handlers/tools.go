// internal/handlers/tools.go
package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"

	"github.com/yourusername/axe-handle/internal/protocol"
	"github.com/yourusername/axe-handle/pkg/mcperrors"
)

// ToolHandler is a function that handles a tool call
type ToolHandler func(ctx context.Context, args json.RawMessage) (interface{}, error)

// ToolsManager manages tool registration and execution
type ToolsManager struct {
	tools    map[string]protocol.Tool
	handlers map[string]ToolHandler
	mu       sync.RWMutex
}

// NewToolsManager creates a new tools manager
func NewToolsManager() *ToolsManager {
	return &ToolsManager{
		tools:    make(map[string]protocol.Tool),
		handlers: make(map[string]ToolHandler),
	}
}

// RegisterTool registers a tool
func (m *ToolsManager) RegisterTool(tool protocol.Tool, handler ToolHandler) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.tools[tool.Name] = tool
	m.handlers[tool.Name] = handler
}

// ListTools returns a list of all registered tools
func (m *ToolsManager) ListTools() []protocol.Tool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	tools := make([]protocol.Tool, 0, len(m.tools))
	for _, tool := range m.tools {
		tools = append(tools, tool)
	}

	return tools
}

// CallTool calls a registered tool
func (m *ToolsManager) CallTool(ctx context.Context, name string, args json.RawMessage) (interface{}, error) {
	m.mu.RLock()
	handler, ok := m.handlers[name]
	m.mu.RUnlock()

	if !ok {
		return nil, mcperrors.NewMethodNotFoundError("tool not found: " + name)
	}

	slog.Debug("Calling tool", "name", name)
	return handler(ctx, args)
}
