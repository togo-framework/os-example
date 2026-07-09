package notes

import (
	"net/http"

	"github.com/togo-framework/togo"
)

// Service is the notes plugin backend.
type Service struct{ k *togo.Kernel }

func New(k *togo.Kernel) *Service { return &Service{k: k} }

// Ping is a sample endpoint (GET /api/notes/ping).
func (s *Service) Ping(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"plugin":"notes","status":"ok"}`))
}
