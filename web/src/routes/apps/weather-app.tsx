import { useEffect, useState } from "react";
import { Cloud, CloudRain, CloudSnow, CloudLightning, Sun, CloudSun, CloudFog, Wind } from "lucide-react";
import { WindowSpinner } from "@togo-framework/ui";
import { API } from "../../lib/api";

interface Current {
  temp: number;
  condition: string;
  location: string;
  wind?: number;
  fallback?: boolean;
}

const ICONS: Record<string, typeof Cloud> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  fog: CloudFog,
};

// Window content for the "weather" OS app — reads /api/weather/current (the Go
// plugin proxies open-meteo) and shows the current conditions.
export function WeatherApp() {
  const [data, setData] = useState<Current | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    fetch(`${API}/api/weather/current`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setErr(true));
  }, []);

  if (err) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Couldn't load weather.</div>;
  if (!data) return <WindowSpinner />;

  const Icon = ICONS[data.condition] ?? Cloud;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-sky-500/10 to-transparent p-8 text-center">
      <Icon className="h-20 w-20 text-sky-500" strokeWidth={1.5} />
      <div className="text-5xl font-semibold tabular-nums">{Math.round(data.temp)}°</div>
      <div className="text-lg font-medium">{data.location}</div>
      <div className="text-sm capitalize text-muted-foreground">{data.condition}</div>
      {data.wind != null && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Wind className="h-4 w-4" /> {Math.round(data.wind)} km/h
        </div>
      )}
      {data.fallback && <div className="mt-1 text-xs text-amber-500">Showing sample data (offline)</div>}
    </div>
  );
}
