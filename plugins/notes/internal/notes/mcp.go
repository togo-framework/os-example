package notes

// This file demonstrates how the notes app plugin would expose an MCP
// tool, using the togomcp.AddTool pattern from
// github.com/togo-framework/mcp/togomcp:
//
//	s := togomcp.Default(os.Getenv("TOGO_MCP_ROLE"))
//	notes.RegisterMCP(s)
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
// 	togomcp.AddTool(s, "notes_status", "Report notes plugin status.",
// 		func(ctx context.Context, in togomcp.NoArgs) (string, error) {
// 			return "notes: ok", nil
// 		})
// }
