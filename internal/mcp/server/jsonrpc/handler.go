// internal/mcp/server/jsonrpc/handler.go
package jsonrpc

import (
	"context"
	"encoding/json"
	"fmt"
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
		// Check if request has a valid ID (meaning it's not a notification)
		if isValidID(req.ID) {
			// Only send error for requests, not notifications
			if err := conn.ReplyWithError(ctx, req.ID, protocol.ErrorConverter(err)); err != nil {
				slog.Error("Failed to send error response", "error", err)
			}
		}
	}
}

// handleInitialize processes the initialize request
// In internal/mcp/server/jsonrpc/handler.go -> handleInitialize

func (h *Handler) handleInitialize(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request) {
	var params protocol.InitializeParams
	slog.Debug("Attempting to unmarshal Initialize params") // <-- Add
	if err := json.Unmarshal(*req.Params, &params); err != nil {
		slog.Error("Failed to unmarshal Initialize params", "error", err) // <-- Add info
		h.sendError(ctx, conn, req.ID, mcperrors.NewInvalidParamsError(err))
		return
	}

	slog.Debug("Params unmarshalled, attempting to call server.Initialize", "params", params) // <-- Add info
	result, err := h.server.Initialize(ctx, params)
	slog.Debug("Returned from server.Initialize", "error", err) // <-- Add log
	if err != nil {
		slog.Error("server.Initialize returned error", "error", err) // <-- Add info
		h.sendError(ctx, conn, req.ID, err)
		return
	}

	// Check if result is nil just in case, though Initialize shouldn't return nil result on success
	if result == nil {
		slog.Error("server.Initialize returned nil result with nil error")
		h.sendError(ctx, conn, req.ID, mcperrors.NewInternalError(fmt.Errorf("unexpected nil result from Initialize")))
		return
	}

	slog.Debug("Attempting to send success reply", "result", result) // <-- Add log
	replyErr := conn.Reply(ctx, req.ID, result)
	slog.Debug("Returned from conn.Reply", "error", replyErr) // <-- Add log
	if replyErr != nil {
		// Log the error, but don't try to send another error response
		slog.Error("Failed to send initialize response via conn.Reply", "error", replyErr)
	}
	slog.Debug("handleInitialize finished") // <-- Add
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
	// Only send error if ID is valid
	if isValidID(id) {
		if err := conn.ReplyWithError(ctx, id, protocol.ErrorConverter(err)); err != nil {
			slog.Error("Failed to send error response", "error", err)
		}
	}
}

// isValidID checks if the ID is valid for responding
func isValidID(id jsonrpc2.ID) bool {
	// For string IDs, check if it's not empty
	if id.IsString {
		return id.Str != ""
	}
	// For numeric IDs, check if it's not zero
	return id.Num != 0
}
