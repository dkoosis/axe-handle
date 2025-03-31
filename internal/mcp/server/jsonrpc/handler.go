// internal/mcp/server/jsonrpc/handler.go
package jsonrpc

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/dkoosis/axe-handle/internal/mcp/protocol"
	"github.com/dkoosis/axe-handle/internal/mcp/tools/api"
	"github.com/dkoosis/axe-handle/internal/mcp/tools/manager"
	"github.com/dkoosis/axe-handle/pkg/mcperrors"
	"github.com/sourcegraph/jsonrpc2"
)

// ServerInterface defines the methods the server must implement
type ServerInterface interface {
	Initialize(ctx context.Context, params protocol.InitializeParams) (*protocol.InitializeResult, error)
	Initialized(ctx context.Context) error
	CheckInitialized() error
	GetToolsManager() *manager.ToolsManager
}

// Handler implements the jsonrpc2.Handler interface
type Handler struct {
	server       ServerInterface
	toolsHandler *api.ToolsHandler
	// You would add other handlers here (resources, prompts, etc.)
}

// NewHandler creates a new jsonrpc2 handler that delegates to the MCP server
func NewHandler(server ServerInterface) *Handler {
	return &Handler{
		server:       server,
		toolsHandler: api.NewToolsHandler(server),
	}
}

// Handle handles JSON-RPC 2.0 requests and notifications
func (h *Handler) Handle(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	// Log the incoming request
	slog.Debug("Received request",
		"method", req.Method,
		"id", req.ID)

	// Handle the request based on its method
	switch req.Method {
	case protocol.MethodInitialize:
		h.handleInitialize(ctx, conn, req)
	case protocol.MethodPing:
		h.handlePing(ctx, conn, req)
	case protocol.MethodToolsList:
		h.toolsHandler.HandleToolsList(ctx, conn, req)
	case protocol.MethodToolsCall:
		h.toolsHandler.HandleToolsCall(ctx, conn, req)
	case protocol.NotificationInitialized:
		h.handleInitialized(ctx, conn, req)
	default:
		err := mcperrors.NewMethodNotFoundError(req.Method)
		// Check if req.ID is the zero value (empty string or 0)
		if req.ID != "" && req.ID != 0 {
			// Only send error for requests, not notifications
			if err := conn.ReplyWithError(ctx, req.ID, protocol.ErrorConverter(err)); err != nil {
				slog.Error("Failed to send error response", "error", err)
			}
		}
	}
}

// handleInitialize processes the initialize request
func (h *Handler) handleInitialize(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params protocol.InitializeParams
	if err := json.Unmarshal(*req.Params, &params); err != nil {
		h.sendError(ctx, conn, req.ID, mcperrors.NewInvalidParamsError(err))
		return
	}

	result, err := h.server.Initialize(ctx, params)
	if err != nil {
		h.sendError(ctx, conn, req.ID, err)
		return
	}

	if err := conn.Reply(ctx, req.ID, result); err != nil {
		slog.Error("Failed to send initialize response", "error", err)
	}
}

// handleInitialized processes the initialized notification
func (h *Handler) handleInitialized(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	// This is a notification, so no response is needed
	err := h.server.Initialized(ctx)
	if err != nil {
		slog.Error("Error handling initialized notification", "error", err)
	}
}

// handlePing processes the ping request
func (h *Handler) handlePing(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	// Simply reply with an empty object
	if err := conn.Reply(ctx, req.ID, struct{}{}); err != nil {
		slog.Error("Failed to send ping response", "error", err)
	}
}

// sendError sends an error response
func (h *Handler) sendError(ctx context.Context, conn *jsonrpc2.Conn, id jsonrpc2.ID, err error) {
	// Check if id is the zero value (empty string or 0)
	if id != "" && id != 0 {
		if err := conn.ReplyWithError(ctx, id, protocol.ErrorConverter(err)); err != nil {
			slog.Error("Failed to send error response", "error", err)
		}
	}
}
