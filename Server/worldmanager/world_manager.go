// worldmanager/world_manager.go
package worldmanager

import (
	"log"
	"sync"

	"mam-server/world"
)

type Manager struct {
	mu     sync.RWMutex
	worlds map[string]*world.World
}

func NewManager() *Manager {
	return &Manager{
		worlds: make(map[string]*world.World),
	}
}

// GetOrCreate returns an existing world or creates/starts one lazily.
func (m *Manager) GetOrCreate(id string) *world.World {
	m.mu.Lock()
	defer m.mu.Unlock()

	if w, ok := m.worlds[id]; ok {
		return w
	}

	w := world.NewWorld(id)
	m.worlds[id] = w
	go w.Run()
	log.Printf("🌍 Created and started world %s", id)
	return w
}

// ListIDs returns all current world IDs (for tooling/debug).
func (m *Manager) ListIDs() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]string, 0, len(m.worlds))
	for id := range m.worlds {
		out = append(out, id)
	}
	return out
}

// ShutdownAll gracefully stops all worlds.
func (m *Manager) ShutdownAll() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for id, w := range m.worlds {
		log.Printf("🛑 Shutting down world %s", id)
		w.Shutdown()
		delete(m.worlds, id)
	}
}
