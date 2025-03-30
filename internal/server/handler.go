// internal/server/handler.go
package server

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/sourcegraph/jsonrpc2"
	"github.com/yourusername/axe-handle/internal/protocol"
	"github.com/yourusername/axe-handle/pkg/mcperrors"
)

// Handler implements the jsonrpc2.Handler interface
type Handler struct {
	server *Server
}

// NewHandler creates a new jsonrpc2 handler that delegates to the MCP server
func NewHandler(server *Server) *Handler {
	return &Handler{
		server: server,
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
		h.handleToolsList(ctx, conn, req)
	case protocol.MethodToolsCall:
		h.handleToolsCall(ctx, conn, req)
	case protocol.MethodResourcesList:
		h.handleResourcesList(ctx, conn, req)
	case protocol.MethodResourcesRead:
		h.handleResourcesRead(ctx, conn, req)
	case protocol.MethodPromptsList:
		h.handlePromptsList(ctx, conn, req)
	case protocol.MethodPromptsGet:
		h.handlePromptsGet(ctx, conn, req)
	case protocol.NotificationInitialized:
		h.handleInitialized(ctx, conn, req)
	default:
		err := mcperrors.NewMethodNotFoundError(req.Method)
		if req.ID != nil {
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
		sendError(ctx, conn, req, mcperrors.NewInvalidParamsError(err))
		return
	}

	result, err := h.server.Initialize(ctx, params)
	if err != nil {
		sendError(ctx, conn, req, err)
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

// Helper functions for other handlers...
// handleToolsList, handleToolsCall, etc. would be implemented similarly

// sendError sends an error response
func sendError(ctx context.Context, conn *jsonrpc2.Conn, req *jsonrpc2.Request, err error) {
	if req.ID != nil {
		if err := conn.ReplyWithError(ctx, req.ID, protocol.ErrorConverter(err)); err != nil {
			slog.Error("Failed to send error response", "error", err)
		}
	}
}
