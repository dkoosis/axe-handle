// internal/mcp/tools/api/tools.go
package api

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/dkoosis/axe-handle/internal/mcp/protocol"
	"github.com/dkoosis/axe-handle/internal/mcp/tools/manager"
	"github.com/dkoosis/axe-handle/pkg/mcperrors"
	"github.com/sourcegraph/jsonrpc2"
)

// ServerHandler provides an interface to the main server functionality
type ServerHandler interface {
	CheckInitialized() error
	GetToolsManager() *manager.ToolsManager
}

// ToolsHandler handles tools-related requests
type ToolsHandler struct {
	server ServerHandler
}

// NewToolsHandler creates a new tools handler
func NewToolsHandler(server ServerHandler) *ToolsHandler {
	return &ToolsHandler{
		server: server,
	}
}

// ToolsListRequest represents a request to list available tools
type ToolsListRequest struct {
	Cursor string `json:"cursor,omitempty"`
}

// ToolsListResult represents the result of a tools list request
type ToolsListResult struct {
	Tools      []protocol.Tool `json:"tools"`
	NextCursor string          `json:"nextCursor,omitempty"`
}

// ToolsCallRequest represents a request to call a tool
type ToolsCallRequest struct {
	Name      string          `json:"name"`
	Arguments json.RawMessage `json:"arguments,omitempty"`
}

// HandleToolsList handles the tools/list request
func (h *ToolsHandler) HandleToolsList(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params ToolsListRequest
	if req.Params != nil {
		if err := json.Unmarshal(*req.Params, &params); err != nil {
			sendError(ctx, conn, req.ID, mcperrors.NewInvalidParamsError(err))
			return
		}
	}

	// Check if server is initialized
	if err := h.server.CheckInitialized(); err != nil {
		sendError(ctx, conn, req.ID, err)
		return
	}

	// Get tools from manager
	tools := h.server.GetToolsManager().ListTools()

	// Create response
	result := ToolsListResult{
		Tools: tools,
		// Pagination not implemented yet
	}

	// Send response
	if err := conn.Reply(ctx, req.ID, result); err != nil {
		slog.Error("Failed to send tools list response", "error", err)
	}
}

// HandleToolsCall handles the tools/call request
func (h *ToolsHandler) HandleToolsCall(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params ToolsCallRequest
	if err := json.Unmarshal(*req.Params, &params); err != nil {
		sendError(ctx, conn, req.ID, mcperrors.NewInvalidParamsError(err))
		return
	}

	// Check if server is initialized
	if err := h.server.CheckInitialized(); err != nil {
		sendError(ctx, conn, req.ID, err)
		return
	}

	// Extract progress token if present
	var progressToken string
	if req.Params != nil {
		var metaParams struct {
			Meta struct {
				ProgressToken string `json:"progressToken"`
			} `json:"_meta"`
		}
		if err := json.Unmarshal(*req.Params, &metaParams); err == nil && metaParams.Meta.ProgressToken != "" {
			progressToken = metaParams.Meta.ProgressToken
		}
	}

	// Call the tool
	result, err := h.server.GetToolsManager().CallTool(ctx, params.Name, params.Arguments, progressToken)
	if err != nil {
		// Log the error
		slog.Error("Error calling tool",
			"name", params.Name,
			"error", err)

		// For tool calls, we return errors as part of the result, not as JSON-RPC errors
		errorResponse := protocol.ToolsCallResult{
			Content: []protocol.Content{
				{
					Type: "text",
					Text: "Error: " + err.Error(),
				},
			},
			IsError: true,
		}

		if err := conn.Reply(ctx, req.ID, errorResponse); err != nil {
			slog.Error("Failed to send tool call error response", "error", err)
		}
		return
	}

	// Send successful result
	if err := conn.Reply(ctx, req.ID, result); err != nil {
		slog.Error("Failed to send tool call response", "error", err)
	}
}

// sendError sends an error response
func sendError(ctx context.Context, conn *jsonrpc2.Conn, id jsonrpc2.ID, err error) {
	rpcErr := mcperrors.FromError(err)

	// Create a properly typed data field
	var data interface{}
	if rpcErr.Data != nil {
		// Convert to JSON first
		if rawBytes, err := json.Marshal(rpcErr.Data); err == nil {
			jsonData := json.RawMessage(rawBytes)
			data = &jsonData
		}
	}

	jsonErr := &jsonrpc2.Error{
		Code:    int64(rpcErr.Code),
		Message: rpcErr.Message,
		Data:    data,
	}

	// Only send error if ID is valid
	if hasValidID(id) {
		if err := conn.ReplyWithError(ctx, id, jsonErr); err != nil {
			slog.Error("Failed to send error response", "error", err)
		}
	}
}

// hasValidID checks if the ID is valid for responding
func hasValidID(id jsonrpc2.ID) bool {
	// Check if it's nil or empty
	if id == nil || id == jsonrpc2.ID(nil) {
		return false
	}

	// Handle different ID types
	switch id := id.(type) {
	case string:
		return id != ""
	case float64:
		return id != 0
	case int:
		return id != 0
	default:
		// For any other type, assume it has value
		return true
	}
}
