import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from "@tanstack/react-router";
import { Providers } from "./providers";
import { sessionMe } from "./lib/auth";
import { OSLoader } from "./routes/os-loader";
import { OSLogin } from "./routes/os-login";
import { Register } from "./routes/register";
import { Reset } from "./routes/reset";
import { AppLayout } from "./routes/app-layout";

const Desktop = lazyRouteComponent(() => import("./routes/desktop"));

// The authenticated admin surface (dashboard charts/widgets/ThemePicker, the
// resource tables/forms/infolists) is the heavy part of the bundle — lazy-load it
// so it splits into its own chunk and the public/auth first paint stays small.
// The router's pending component (SentraLoading) shows while the chunk loads.
const Dashboard = lazyRouteComponent(() => import("./routes/dashboard"), "Dashboard");
const AdminHome = lazyRouteComponent(() => import("./routes/admin"), "AdminHome");
const AdminResource = lazyRouteComponent(() => import("./routes/admin-resource"), "AdminResource");
const Users = lazyRouteComponent(() => import("./routes/users"), "Users");
const Mail = lazyRouteComponent(() => import("./routes/mail"), "Mail");
const Profile = lazyRouteComponent(() => import("./routes/profile"), "Profile");

const rootRoute = createRootRoute({ component: () => (<Providers><Outlet /></Providers>) });

// Already signed in → skip the auth pages and go straight to the desktop.
const redirectIfAuthed = async () => {
  if (await sessionMe()) throw redirect({ to: "/desktop" });
};

// The home page IS the OS login screen (Windows/macOS/Linux style). Authed
// visitors skip straight to the desktop; everyone else gets the lock screen.
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: OSLogin, beforeLoad: redirectIfAuthed });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: "/login", component: OSLogin, beforeLoad: redirectIfAuthed });
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/register", component: Register, beforeLoad: redirectIfAuthed });
const resetRoute = createRoute({ getParentRoute: () => rootRoute, path: "/reset", component: Reset });

// Auth guard: redirect to /login before any protected route paints. Returns the
// resolved user as route context so children don't re-fetch /me.
const requireAuth = async () => {
  const me = await sessionMe();
  if (!me) throw redirect({ to: "/login" });
  return { me };
};

// The desktop is its OWN full-screen route — NOT wrapped in the admin AppLayout
// (sidebar/header). It renders the OS DesktopShell edge-to-edge; the admin
// surfaces below live under a separate AppLayout-wrapped branch.
const desktopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/desktop",
  component: Desktop,
  beforeLoad: requireAuth,
});

// The admin surface (dashboard/resources/users/mail/profile) — wrapped in the
// AppLayout sidebar+header chrome. Reachable directly by URL, but the desktop is
// the primary post-login landing.
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_app",
  component: AppLayout,
  beforeLoad: requireAuth,
});
const dashboardRoute = createRoute({ getParentRoute: () => appRoute, path: "/dashboard", component: Dashboard });
const adminRoute = createRoute({ getParentRoute: () => appRoute, path: "/admin", component: AdminHome });
const resourceRoute = createRoute({ getParentRoute: () => appRoute, path: "/admin/$resource", component: AdminResource });
const usersRoute = createRoute({ getParentRoute: () => appRoute, path: "/users", component: Users });
const mailRoute = createRoute({ getParentRoute: () => appRoute, path: "/mail", component: Mail });
const profileRoute = createRoute({ getParentRoute: () => appRoute, path: "/profile", component: Profile });

const routeTree = rootRoute.addChildren([
  indexRoute, loginRoute, registerRoute, resetRoute, desktopRoute,
  appRoute.addChildren([dashboardRoute, adminRoute, resourceRoute, usersRoute, mailRoute, profileRoute]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  // OS-style full-screen loader while a route's beforeLoad (e.g. the auth check) runs.
  // 150ms delay so cached/instant navigations don't flash it.
  defaultPendingComponent: () => <OSLoader />,
  defaultPendingMs: 150,
  defaultPendingMinMs: 300,
});

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
