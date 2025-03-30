// internal/server/tools.go
package server

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/sourcegraph/jsonrpc2"
	"github.com/yourusername/axe-handle/internal/protocol"
	"github.com/yourusername/axe-handle/pkg/mcperrors"
)

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

// ToolsCallResult represents the result of a tool call
type ToolsCallResult struct {
	Content []protocol.Content `json:"content"`
	IsError bool               `json:"isError,omitempty"`
}

// handleToolsList handles the tools/list request
func (h *Handler) handleToolsList(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params ToolsListRequest
	if req.Params != nil {
		if err := json.Unmarshal(*req.Params, &params); err != nil {
			sendError(ctx, conn, req, mcperrors.NewInvalidParamsError(err))
			return
		}
	}

	// Check if server is initialized
	if err := h.server.checkInitialized(); err != nil {
		sendError(ctx, conn, req, err)
		return
	}

	tools := h.server.toolsManager.ListTools()

	result := ToolsListResult{
		Tools: tools,
		// Pagination not implemented yet
	}

	if err := conn.Reply(ctx, req.ID, result); err != nil {
		slog.Error("Failed to send tools list response", "error", err)
	}
}

// handleToolsCall handles the tools/call request
func (h *Handler) handleToolsCall(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params ToolsCallRequest
	if err := json.Unmarshal(*req.Params, &params); err != nil {
		sendError(ctx, conn, req, mcperrors.NewInvalidParamsError(err))
		return
	}

	// Check if server is initialized
	if err := h.server.checkInitialized(); err != nil {
		sendError(ctx, conn, req, err)
		return
	}

	result, err := h.server.toolsManager.CallTool(ctx, params.Name, params.Arguments)
	if err != nil {
		// For tool calls, we return errors as part of the result, not as JSON-RPC errors
		content := []protocol.Content{
			{
				Type: "text",
				Text: "Error: " + err.Error(),
			},
		}

		response := ToolsCallResult{
			Content: content,
			IsError: true,
		}

		if err := conn.Reply(ctx, req.ID, response); err != nil {
			slog.Error("Failed to send tool call error response", "error", err)
		}
		return
	}

	if err := conn.Reply(ctx, req.ID, result); err != nil {
		slog.Error("Failed to send tool call response", "error", err)
	}
}
