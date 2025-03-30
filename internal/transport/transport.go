// internal/transport/transport.go
package transport

import (
	"context"

	"github.com/sourcegraph/jsonrpc2"
)

// Transport defines the interface for MCP transports
type Transport interface {
	// Connect establishes the transport connection
	Connect(ctx context.Context, handler jsonrpc2.Handler) (*jsonrpc2.Conn, error)

	// Close closes the transport
	Close() error
}
