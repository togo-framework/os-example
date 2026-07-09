// Client for the notification-center plugin's /api/notifications* endpoints.
import { API } from "./api";
import type { OSNotification } from "@togo-framework/ui";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/notifications${path}`, { credentials: "include", ...init });
  return res.json();
}

export const notifications = {
  list: (): Promise<OSNotification[]> => req("/"),
  unreadCount: (): Promise<number> => req<{ count: number }>("/unread-count").then((d) => d.count),
  markRead: (id: string) => req(`/${id}/read`, { method: "POST" }),
  markAllRead: () => req("/read-all", { method: "POST" }),
};
