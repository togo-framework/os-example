package weather

// This file demonstrates how the weather app plugin would expose an MCP
// tool, using the togomcp.AddTool pattern from
// github.com/togo-framework/mcp/togomcp:
//
//	s := togomcp.Default(os.Getenv("TOGO_MCP_ROLE"))
//	weather.RegisterMCP(s)
//	s.Run()
//
// NOTE: there is no established mechanism today for a plugin to auto-merge
// into the app's main MCP server — each togomcp.Default() builds one server;
// no cross-plugin merge mechanism exists yet. An app's own cmd/mcp binary
// would need to call RegisterMCP explicitly.
//
// import (
// 	"context"
//
// 	"github.com/togo-framework/mcp/togomcp"
// )
//
// // RegisterMCP adds this plugin's tools to an existing MCP server.
// func RegisterMCP(s *togomcp.Server) {
// 	togomcp.AddTool(s, "weather_status", "Report weather plugin status.",
// 		func(ctx context.Context, in togomcp.NoArgs) (string, error) {
// 			return "weather: ok", nil
// 		})
// }
