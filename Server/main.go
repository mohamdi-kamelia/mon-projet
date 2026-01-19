package main

import (
	"log"
	"mam-server/worldmanager"
	"mam-server/ws"
	"net/http"
	"os"
	"os/signal"
	"syscall"
)

type lookupAdapter struct{ m *worldmanager.Manager }

func (a lookupAdapter) GetOrCreate(id string) ws.WorldInterface {
	return a.m.GetOrCreate(id)
}

// CORS middleware to allow WebGL/web builds
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func main() {
	log.Println("🚀 Starting MAM Server...")

	manager := worldmanager.NewManager()
	adapter := lookupAdapter{m: manager}

	http.HandleFunc("/ws", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		worldID := r.URL.Query().Get("world")
		if worldID == "" {
			worldID = "main_world"
		}
		chosen := manager.GetOrCreate(worldID)
		ws.HandleWebSocket(w, r, chosen, adapter)
	}))

	// Health check
	http.HandleFunc("/health", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	}))

	// Optional: list current worlds
	http.HandleFunc("/worlds", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		ids := manager.ListIDs()
		w.Write([]byte(`{"worlds":[`))
		for i, id := range ids {
			if i > 0 {
				w.Write([]byte(","))
			}
			w.Write([]byte(`"` + id + `"`))
		}
		w.Write([]byte(`]}`))
	}))

	// Graceful shutdown (stop all worlds)
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		log.Println("🛑 Shutdown signal received, stopping server...")
		manager.ShutdownAll()
		os.Exit(0)
	}()

	// Start HTTP server
	port := ":8080"
	log.Printf("🌐 Server listening on port %s", port)
	log.Printf("🔗 WebSocket endpoint: ws://localhost%s/ws?world=<your_world>", port)
	log.Printf("⚠️  CORS enabled for all origins")

	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("❌ Server failed to start: %v", err)
	}
}
