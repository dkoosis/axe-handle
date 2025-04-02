// internal/transport/stdio.go
package transport

import (
	"context"
	"io"
	"log/slog"
	"os"

	// "encoding/hex" // Uncomment if using hex logging in Read/Write

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

// In internal/transport/stdio.go -> Connect method

// In internal/transport/stdio.go -> Connect method

func (t *StdioTransport) Connect(ctx context.Context, handler jsonrpc2.Handler) (*jsonrpc2.Conn, error) {
	// Use NewPlainObjectStream for unframed JSON over stdio
	stream := jsonrpc2.NewPlainObjectStream(stdioPipe{}) // <-- Use NewPlainObjectStream

	conn := jsonrpc2.NewConn(ctx, stream, handler)
	t.conn = conn

	slog.Info("Connected stdio transport (using NewPlainObjectStream)") // <-- Log updated

	return conn, nil
}

// Close closes the transport
func (t *StdioTransport) Close() error {
	if t.conn != nil {
		// Add check to prevent closing if already disconnected? Maybe not necessary.
		err := t.conn.Close()
		t.conn = nil // Prevent double close attempts
		slog.Info("stdio transport connection closed")
		return err
	}
	slog.Warn("Close called on stdio transport but connection was already nil")
	return nil
}

// stdioPipe implements io.ReadWriteCloser for stdin/stdout
type stdioPipe struct{}

// Read reads from standard input and logs the data/errors
func (stdioPipe) Read(p []byte) (n int, err error) {
	n, err = os.Stdin.Read(p)

	// Log the data read (only if bytes were actually read)
	if n > 0 {
		// Log prefix to avoid excessive log size for large messages
		prefixLen := 150 // Log roughly the first 150 bytes
		if n < prefixLen {
			prefixLen = n
		}
		slog.Debug("stdioPipe Read",
			"bytes_read", n,
			"data_prefix", string(p[:prefixLen]), // Log prefix as string
			// For more detail, uncomment below to log hex:
			// "data_hex_prefix", hex.EncodeToString(p[:prefixLen]),
		)
	}

	// Log any error encountered, including EOF
	if err != nil {
		// EOF is expected when the client closes stdin, log as debug/info?
		if err == io.EOF {
			slog.Debug("stdioPipe Read: EOF received")
		} else {
			slog.Error("stdioPipe Read error", "error", err)
		}
	}

	return n, err
}

// Write writes to standard output
func (stdioPipe) Write(p []byte) (int, error) {
	// Optional: Add logging here too if debugging output framing?
	// writePrefixLen := 150
	// if len(p) < writePrefixLen { writePrefixLen = len(p)}
	// slog.Debug("stdioPipe Write", "bytes_to_write", len(p), "data_prefix", string(p[:writePrefixLen]))
	return os.Stdout.Write(p)
}

// Close is called when the jsonrpc2 connection is closing the stream
func (stdioPipe) Close() error {
	slog.Debug("stdioPipe Close called (Stdin/Stdout not actually closed)")
	// We don't actually close stdin/stdout when the stream closes
	return nil
}
