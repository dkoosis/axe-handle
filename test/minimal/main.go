package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync" // Added for managing connection counter

	"github.com/gorilla/websocket"
)

// Configure the WebSocket upgrader
// CheckOrigin allows connections from any origin - good for local dev,
// but consider security implications for production.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections for this minimal example
		return true
	},
}

// A simple structure for our acknowledgement message
type AckMessage struct {
	Type    string `json:"type"`
	Message string `json:"message"`
	Payload any    `json:"payload,omitempty"` // Include received payload if needed
}

var (
	connCounter int
	connMutex   sync.Mutex
)

// handleConnections is the handler for incoming WebSocket connections
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	// Make sure we close the connection when the function returns
	defer ws.Close()

	connMutex.Lock()
	connCounter++
	connID := connCounter
	connMutex.Unlock()
	log.Printf("Client %d connected", connID)

	// Optional: Send an initial hello message upon connection
	// Depending on MCP spec, this might be needed or replaced by specific handshake messages
	initialMsg := AckMessage{Type: "mcp_hello", Message: "Welcome to Go Minimal MCP Server"}
	if err := ws.WriteJSON(initialMsg); err != nil {
		log.Printf("Client %d: Failed to send initial hello: %v", connID, err)
		// Don't necessarily return here, maybe the client can still send messages
	}

	// Infinite loop to read messages from the client
	for {
		messageType, p, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Client %d: Error reading message: %v", connID, err)
			} else {
				log.Printf("Client %d disconnected.", connID)
			}
			break // Exit loop on error or disconnection
		}

		log.Printf("Client %d: Received message (type %d): %s", connID, messageType, string(p))

		// Try to parse the incoming message as JSON (optional, good for debugging)
		var receivedMsg map[string]interface{}
		if json.Unmarshal(p, &receivedMsg) == nil {
			log.Printf("Client %d: Parsed JSON: %+v", connID, receivedMsg)
			// You could inspect receivedMsg["type"] here for actual MCP commands
		} else {
			log.Printf("Client %d: Message was not valid JSON.", connID)
		}

		// Send back a simple acknowledgement message
		// In a real MCP server, you would parse the request (p)
		// and send back a specific MCP response based on its type and content.
		ack := AckMessage{
			Type:    "acknowledgement",
			Message: fmt.Sprintf("Server received %d bytes.", len(p)),
			// Payload: receivedMsg, // Optionally echo back parsed message
		}

		// Send the acknowledgement as JSON
		if err := ws.WriteJSON(ack); err != nil {
			log.Printf("Client %d: Failed to write JSON response: %v", connID, err)
			break
		}
	}
}

func main() {
	port := "18765"
	endpoint := "/mcp"

	// Configure WebSocket route
	http.HandleFunc(endpoint, handleConnections)

	// Start the server on localhost
	log.Printf("MCP WebSocket server starting on ws://localhost:%s%s", port, endpoint)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal("ListenAndServe Error: ", err)
	}
}
