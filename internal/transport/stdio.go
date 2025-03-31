// internal/transport/stdio.go
package transport

import (
	"bufio"
	"context"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/dkoosis/axe-handle/pkg/mcperrors"
	"github.com/sourcegraph/jsonrpc2"
)

// StdioTransport implements the Transport interface for stdio communication
type StdioTransport struct {
	conn     *jsonrpc2.Conn
	reader   *bufio.Reader
	writer   *bufio.Writer
	mu       sync.Mutex
	doneChan chan struct{}
}

// NewStdioTransport creates a new stdio transport
func NewStdioTransport() *StdioTransport {
	return &StdioTransport{
		reader:   bufio.NewReader(os.Stdin),
		writer:   bufio.NewWriter(os.Stdout),
		doneChan: make(chan struct{}),
	}
}

// Connect establishes the transport connection over stdin/stdout
func (t *StdioTransport) Connect(ctx context.Context, handler jsonrpc2.Handler) (*jsonrpc2.Conn, error) {
	// Create a JSONRPC stream using our custom stdio reader/writer
	stream := jsonrpc2.NewBufferedStream(t, jsonrpc2.VSCodeObjectCodec{})

	// Create connection with the provided handler
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
		close(t.doneChan)
		return err
	}
	return nil
}

// Read implements io.Reader for jsonrpc2.Stream
// Handles reading messages with Content-Length headers
func (t *StdioTransport) Read(p []byte) (int, error) {
	// Read headers
	var contentLength int

	for {
		line, err := t.reader.ReadString('\n')
		if err != nil {
			return 0, err
		}

		line = strings.TrimSpace(line)
		if line == "" {
			break // End of headers
		}

		if strings.HasPrefix(line, "Content-Length: ") {
			length := strings.TrimPrefix(line, "Content-Length: ")
			contentLength, err = strconv.Atoi(length)
			if err != nil {
				return 0, mcperrors.NewParseError(
					fmt.Errorf("invalid Content-Length header: %w", err))
			}
		}
	}

	if contentLength == 0 {
		return 0, mcperrors.NewParseError(
			fmt.Errorf("missing or zero Content-Length header"))
	}

	// Check if our buffer is big enough
	if len(p) < contentLength {
		return 0, mcperrors.NewInternalError(
			fmt.Errorf("buffer too small for message: %d < %d", len(p), contentLength))
	}

	// Read exactly contentLength bytes
	bytesRead := 0
	for bytesRead < contentLength {
		n, err := t.reader.Read(p[bytesRead:contentLength])
		if err != nil {
			return bytesRead, err
		}
		bytesRead += n
	}

	return contentLength, nil
}

// Write implements io.Writer for jsonrpc2.Stream
// Adds proper Content-Length headers to outgoing messages
func (t *StdioTransport) Write(p []byte) (int, error) {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Write header with content length
	header := fmt.Sprintf("Content-Length: %d\r\n\r\n", len(p))
	if _, err := t.writer.WriteString(header); err != nil {
		return 0, err
	}

	// Write message body
	n, err := t.writer.Write(p)
	if err != nil {
		return n, err
	}

	// Flush to ensure message is sent
	if err := t.writer.Flush(); err != nil {
		return n, err
	}

	return n, nil
}

// Close impl
