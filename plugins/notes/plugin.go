// Package notes is a togo plugin (mini-app) that is also a registered OS
// app for the desktop shell. It self-registers on blank-import via
// `togo install`. Backend logic lives in internal/notes; UI in web/.
package notes

import (
	"github.com/togo-framework/os"
	"github.com/togo-framework/togo"

	"github.com/togo-framework/os-example/plugins/notes/internal/notes"
)

const Name = "notes"

func init() {
	os.RegisterApp(os.AppMeta{
		Slug:     Name,
		Name:     "Notes",
		Icon:     "sticky-note",
		Color:    "#f59e0b",
		Category: "productivity",
		Window: os.WindowSpec{
			Width:     800,
			Height:    600,
			Resizable: true,
		},
	})

	// +20: mounts a route directly, so it must run after auth's middleware
	// registration (PriorityLate+5) — chi panics if routes exist before Use().
	togo.RegisterProviderFunc(Name, togo.PriorityLate+20, func(k *togo.Kernel) error {
		svc := notes.New(k)
		k.Router.Get("/api/notes/ping", svc.Ping)
		k.Set(Name, svc)
		if k.Log != nil {
			k.Log.Info("plugin active", "plugin", Name)
		}
		return nil
	})
}
