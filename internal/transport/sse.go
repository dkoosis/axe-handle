// internal/transport/sse.go
package transport

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"

	"github.com/sourcegraph/jsonrpc2"
)

// SSETransport implements the Transport interface for SSE communication
type SSETransport struct {
	port        int
	host        string
	path        string
	messagePath string
	server      *http.Server
	handler     jsonrpc2.Handler
	clients     map[string]*sseClient
	mu          sync.RWMutex
}

// sseClient represents a connected SSE client
type sseClient struct {
	id         string
	conn       *jsonrpc2.Conn
	messagesCh chan []byte
	done       chan struct{}
}

// NewSSETransport creates a new SSE transport
func NewSSETransport(host string, port int) *SSETransport {
	return &SSETransport{
		host:        host,
		port:        port,
		path:        "/sse",
		messagePath: "/messages",
		clients:     make(map[string]*sseClient),
	}
}

// Connect establishes the HTTP server for SSE connections
func (t *SSETransport) Connect(ctx context.Context, handler jsonrpc2.Handler) (*jsonrpc2.Conn, error) {
	t.handler = handler

	// Set up HTTP routes
	mux := http.NewServeMux()
	mux.HandleFunc(t.path, t.handleSSE)
	mux.HandleFunc(t.messagePath, t.handleMessages)

	// Create HTTP server
	t.server = &http.Server{
		Addr:    fmt.Sprintf("%s:%d", t.host, t.port),
		Handler: mux,
	}

	// Start server in a goroutine
	go func() {
		slog.Info("Starting SSE server", "address", t.server.Addr)
		if err := t.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("SSE server error", "error", err)
		}
	}()

	return nil, nil // No single connection for SSE
}

// handleSSE handles SSE connections
func (t *SSETransport) handleSSE(w http.ResponseWriter, r *http.Request) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Create unique client ID
	clientID := fmt.Sprintf("%p", r)

	// Set up client
	client := &sseClient{
		id:         clientID,
		messagesCh: make(chan []byte, 100),
		done:       make(chan struct{}),
	}

	// Register client
	t.mu.Lock()
	t.clients[clientID] = client
	t.mu.Unlock()

	// Clean up on disconnect
	defer func() {
		t.mu.Lock()
		delete(t.clients, clientID)
		t.mu.Unlock()
		close(client.done)
		close(client.messagesCh)
	}()

	// Set up client connection with a custom stream
	client.conn = jsonrpc2.NewConn(
		r.Context(),
		jsonrpc2.NewBufferedStream(newSSEStream(client, clientID), jsonrpc2.VSCodeObjectCodec{}),
		t.handler,
	)

	// Notify client of connection
	fmt.Fprintf(w, "data: {\"sessionId\": \"%s\"}\n\n", clientID)
	w.(http.Flusher).Flush()

	// Keep connection open and send messages
	for {
		select {
		case <-r.Context().Done():
			return
		case <-client.done:
			return
		case msg, ok := <-client.messagesCh:
			if !ok {
				return
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			w.(http.Flusher).Flush()
		}
	}
}

// handleMessages handles incoming messages from clients
func (t *SSETransport) handleMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get client ID from query parameters
	clientID := r.URL.Query().Get("sessionId")
	if clientID == "" {
		http.Error(w, "Missing sessionId", http.StatusBadRequest)
		return
	}

	// Find client
	t.mu.RLock()
	client, ok := t.clients[clientID]
	t.mu.RUnlock()

	if !ok {
		http.Error(w, "Unknown sessionId", http.StatusBadRequest)
		return
	}

	// Parse JSON-RPC message
	var msg json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Process message through client connection
	if err := client.conn.Notify(r.Context(), "$/message", msg); err != nil {
		http.Error(w, "Error processing message", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// Close shuts down the HTTP server
func (t *SSETransport) Close() error {
	if t.server != nil {
		// Close all client connections
		t.mu.Lock()
		for _, client := range t.clients {
			close(client.done)
		}
		t.clients = make(map[string]*sseClient)
		t.mu.Unlock()

		// Shut down HTTP server
		return t.server.Shutdown(context.Background())
	}
	return nil
}

// sseStream implements jsonrpc2.Stream for SSE
type sseStream struct {
	client   *sseClient
	clientID string
	msgs     chan json.RawMessage
}

func newSSEStream(client *sseClient, clientID string) *sseStream {
	return &sseStream{
		client:   client,
		clientID: clientID,
		msgs:     make(chan json.RawMessage, 100),
	}
}

func (s *sseStream) Read(ctx context.Context) (json.RawMessage, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-s.client.done:
		return nil, io.EOF
	case msg, ok := <-s.msgs:
		if !ok {
			return nil, io.EOF
		}
		return msg, nil
	}
}

func (s *sseStream) Write(ctx context.Context, msg json.RawMessage) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-s.client.done:
		return io.EOF
	default:
		s.client.messagesCh <- msg
		return nil
	}
}

func (s *sseStream) Close() error {
	close(s.msgs)
	return nil
}
