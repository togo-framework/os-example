// Package prefs is a togo plugin (mini-app) that is also a registered OS
// app for the desktop shell. It self-registers on blank-import via
// `togo install`. Backend logic lives in internal/prefs; UI in web/.
package prefs

import (
	"github.com/togo-framework/os"
	"github.com/togo-framework/togo"

	"github.com/togo-framework/os-example/plugins/prefs/internal/prefs"
)

const Name = "prefs"

func init() {
	os.RegisterApp(os.AppMeta{
		Slug:     Name,
		Name:     "Settings",
		Icon:     "settings",
		Color:    "#64748b",
		Category: "system",
		Window: os.WindowSpec{
			Width:     800,
			Height:    600,
			Resizable: true,
		},
	})

	// +20: mounts a route directly, so it must run after auth's middleware
	// registration (PriorityLate+5) — chi panics if routes exist before Use().
	togo.RegisterProviderFunc(Name, togo.PriorityLate+20, func(k *togo.Kernel) error {
		svc := prefs.New(k)
		k.Router.Get("/api/prefs/ping", svc.Ping)
		k.Set(Name, svc)
		if k.Log != nil {
			k.Log.Info("plugin active", "plugin", Name)
		}
		return nil
	})
}
