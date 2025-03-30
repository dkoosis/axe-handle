// internal/transport/stdio.go
package transport

import (
	"context"
	"log/slog"
	"os"

	"github.com/sourcegraph/jsonrpc2"
)

// StdioTransport implements the Transport interface for stdio communication
type StdioTransport struct {
	conn *jsonrpc2.Conn
}

// NewStdioTransport creates a new stdio transport
func NewStdioTransport() *StdioTransport {
	return &StdioTransport{}
}

// Connect establishes the transport connection over stdin/stdout
func (t *StdioTransport) Connect(ctx context.Context, handler jsonrpc2.Handler) (*jsonrpc2.Conn, error) {
	stream := jsonrpc2.NewBufferedStream(stdioPipe{}, jsonrpc2.VSCodeObjectCodec{})
	conn := jsonrpc2.NewConn(ctx, stream, handler)
	t.conn = conn

	slog.Info("Connected stdio transport")
	return conn, nil
}

// Close closes the transport
func (t *StdioTransport) Close() error {
	if t.conn != nil {
		err := t.conn.Close()
		t.conn = nil
		return err
	}
	return nil
}

// stdioPipe implements io.ReadWriteCloser for stdin/stdout
type stdioPipe struct{}

func (stdioPipe) Read(p []byte) (int, error) {
	return os.Stdin.Read(p)
}

func (stdioPipe) Write(p []byte) (int, error) {
	return os.Stdout.Write(p)
}

func (stdioPipe) Close() error {
	// We don't actually close stdin/stdout
	return nil
}
