package weather

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/togo-framework/togo"
)

// Service is the weather plugin backend. It proxies the free open-meteo API so
// the desktop's weather app + top-bar widget have live data without a key.
type Service struct {
	k      *togo.Kernel
	client *http.Client
}

func New(k *togo.Kernel) *Service {
	return &Service{k: k, client: &http.Client{Timeout: 6 * time.Second}}
}

// Ping is a sample endpoint (GET /api/weather/ping).
func (s *Service) Ping(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"plugin":"weather","status":"ok"}`))
}

// Current returns the current weather for a lat/lon (defaults to Cairo). Query:
// ?lat=..&lon=..&place=..  → {temp, code, condition, location, wind}.
func (s *Service) Current(w http.ResponseWriter, r *http.Request) {
	lat := def(r.URL.Query().Get("lat"), "30.04")
	lon := def(r.URL.Query().Get("lon"), "31.24")
	place := def(r.URL.Query().Get("place"), "Cairo")

	url := "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current=temperature_2m,weather_code,wind_speed_10m"

	out := map[string]any{"location": place}
	resp, err := s.client.Get(url)
	if err == nil {
		defer resp.Body.Close()
		var body struct {
			Current struct {
				Temp float64 `json:"temperature_2m"`
				Code int     `json:"weather_code"`
				Wind float64 `json:"wind_speed_10m"`
			} `json:"current"`
		}
		if json.NewDecoder(resp.Body).Decode(&body) == nil {
			out["temp"] = body.Current.Temp
			out["code"] = body.Current.Code
			out["wind"] = body.Current.Wind
			out["condition"] = condition(body.Current.Code)
		} else {
			err = errDecode
		}
	}
	if err != nil {
		// Graceful fallback so the widget always has something to show offline.
		out["temp"] = 24
		out["code"] = 1
		out["condition"] = "partly"
		out["fallback"] = true
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(out)
}

var errDecode = &decodeErr{}

type decodeErr struct{}

func (*decodeErr) Error() string { return "decode failed" }

func def(v, d string) string {
	if v == "" {
		return d
	}
	return v
}

// condition maps a WMO weather code to a coarse condition the WeatherWidget
// understands: clear | partly | cloudy | fog | rain | snow | storm.
func condition(code int) string {
	switch {
	case code == 0:
		return "clear"
	case code <= 2:
		return "partly"
	case code == 3:
		return "cloudy"
	case code >= 45 && code <= 48:
		return "fog"
	case code >= 51 && code <= 67:
		return "rain"
	case code >= 71 && code <= 77:
		return "snow"
	case code >= 80 && code <= 82:
		return "rain"
	case code >= 95:
		return "storm"
	default:
		return "cloudy"
	}
}
