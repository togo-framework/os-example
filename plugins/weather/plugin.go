// Package weather is a togo plugin (mini-app) that is also a registered OS
// app for the desktop shell. It self-registers on blank-import via
// `togo install`. Backend logic lives in internal/weather; UI in web/.
package weather

import (
	"github.com/togo-framework/os"
	"github.com/togo-framework/togo"

	"github.com/togo-framework/os-example/plugins/weather/internal/weather"
)

const Name = "weather"

func init() {
	os.RegisterApp(os.AppMeta{
		Slug:     Name,
		Name:     "Weather",
		Icon:     "cloud-sun",
		Color:    "#0ea5e9",
		Category: "utility",
		Window: os.WindowSpec{
			Width:     800,
			Height:    600,
			Resizable: true,
		},
	})

	// +20: mounts routes directly, so it must run after auth's middleware
	// registration (PriorityLate+5) — chi panics if routes exist before Use().
	togo.RegisterProviderFunc(Name, togo.PriorityLate+20, func(k *togo.Kernel) error {
		svc := weather.New(k)
		k.Router.Get("/api/weather/ping", svc.Ping)
		k.Router.Get("/api/weather/current", svc.Current)
		k.Set(Name, svc)
		if k.Log != nil {
			k.Log.Info("plugin active", "plugin", Name)
		}
		return nil
	})
}
