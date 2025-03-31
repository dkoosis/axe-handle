// internal/mcp/tools/manager/tools.go
package manager

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"sync"
	"time"

	"github.com/dkoosis/axe-handle/internal/mcp/protocol"
	jsonschema "github.com/xeipuuv/gojsonschema"
)

// ToolHandler is a function that handles a tool call with progress reporting
type ToolHandler func(ctx context.Context, args json.RawMessage, progressCh chan<- float64) (protocol.ToolsCallResult, error)

// ProgressReporter is a function that reports tool execution progress
type ProgressReporter func(toolName string, token string, progress float64, total float64)

// ToolsManager manages tool registration and execution
type ToolsManager struct {
	tools            map[string]protocol.Tool
	handlers         map[string]ToolHandler
	progressReporter ProgressReporter
	mu               sync.RWMutex

	// Configuration
	defaultTimeout time.Duration
}

// NewToolsManager creates a new tools manager
func NewToolsManager() *ToolsManager {
	return &ToolsManager{
		tools:          make(map[string]protocol.Tool),
		handlers:       make(map[string]ToolHandler),
		defaultTimeout: 30 * time.Second,
	}
}

// SetProgressReporter sets the function to call when reporting progress
func (m *ToolsManager) SetProgressReporter(reporter ProgressReporter) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.progressReporter = reporter
}

// RegisterTool registers a tool with the manager
func (m *ToolsManager) RegisterTool(tool protocol.Tool, handler ToolHandler) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Validate tool definition
	if tool.Name == "" {
		slog.Error("Attempted to register tool with empty name", "tool", tool)
		return
	}

	if tool.InputSchema == nil {
		slog.Error("Attempted to register tool with nil input schema", "tool_name", tool.Name)
		return
	}

	m.tools[tool.Name] = tool
	m.handlers[tool.Name] = handler

	slog.Info("Registered tool", "name", tool.Name, "description", tool.Description)
}

// UnregisterTool removes a tool from the manager
func (m *ToolsManager) UnregisterTool(name string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.tools, name)
	delete(m.handlers, name)

	slog.Info("Unregistered tool", "name", name)
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

// CallTool calls a registered tool with the given name and arguments
func (m *ToolsManager) CallTool(ctx context.Context, name string, args json.RawMessage, progressToken string) (protocol.ToolsCallResult, error) {
	// Check if tool exists
	m.mu.RLock()
	tool, toolExists := m.tools[name]
	handler, handlerExists := m.handlers[name]
	progressReporter := m.progressReporter
	m.mu.RUnlock()

	if !toolExists || !handlerExists {
		return protocol.ToolsCallResult{
			Content: []protocol.Content{
				{
					Type: "text",
					Text: fmt.Sprintf("Tool '%s' not found", name),
				},
			},
			IsError: true,
		}, nil
	}

	// Log tool call
	slog.Info("Calling tool",
		"name", name,
		"progress_token", progressToken,
		"args_size", len(args))

	// Validate arguments against schema
	if err := validateToolArguments(tool.InputSchema, args); err != nil {
		slog.Error("Tool argument validation failed",
			"name", name,
			"error", err)

		return protocol.ToolsCallResult{
			Content: []protocol.Content{
				{
					Type: "text",
					Text: fmt.Sprintf("Invalid arguments: %s", err),
				},
			},
			IsError: true,
		}, nil
	}

	// Add timeout if not already present
	var cancel context.CancelFunc
	if _, hasDeadline := ctx.Deadline(); !hasDeadline {
		ctx, cancel = context.WithTimeout(ctx, m.defaultTimeout)
		defer cancel()
	}

	// Create progress channel
	progressCh := make(chan float64, 10)

	// Handle progress reporting in separate goroutine
	if progressReporter != nil && progressToken != "" {
		go func() {
			for {
				select {
				case <-ctx.Done():
					return
				case progress, ok := <-progressCh:
					if !ok {
						return // Channel closed
					}
					progressReporter(name, progressToken, progress, 100.0)
				}
			}
		}()
	}

	// Execute tool
	startTime := time.Now()
	result, err := handler(ctx, args, progressCh)
	duration := time.Since(startTime)

	// Close progress channel
	close(progressCh)

	// Handle successful execution
	if err == nil {
		slog.Info("Tool executed successfully",
			"name", name,
			"duration_ms", duration.Milliseconds())
		return result, nil
	}

	// Handle error
	slog.Error("Tool execution failed",
		"name", name,
		"error", err,
		"duration_ms", duration.Milliseconds())

	// Convert error to user-friendly result
	return protocol.ToolsCallResult{
		Content: []protocol.Content{
			{
				Type: "text",
				Text: fmt.Sprintf("Tool execution failed: %s", err),
			},
		},
		IsError: true,
	}, nil
}

// validateToolArguments validates the provided arguments against the tool's input schema
func validateToolArguments(schemaObj interface{}, args json.RawMessage) error {
	// Convert schema to proper format
	schemaLoader := jsonschema.NewGoLoader(schemaObj)

	// Load document to validate
	documentLoader := jsonschema.NewBytesLoader(args)

	// Perform validation
	result, err := jsonschema.Validate(schemaLoader, documentLoader)
	if err != nil {
		return fmt.Errorf("schema validation error: %w", err)
	}

	// Check validation result
	if !result.Valid() {
		// Collect validation errors
		var errMsg string
		for i, err := range result.Errors() {
			if i > 0 {
				errMsg += "; "
			}
			errMsg += err.String()
		}
		return fmt.Errorf("invalid arguments: %s", errMsg)
	}

	return nil
}

// SetDefaultTimeout sets the default timeout for tool execution
func (m *ToolsManager) SetDefaultTimeout(timeout time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.defaultTimeout = timeout
}
