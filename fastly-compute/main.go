package main

import (
	"context"
	"strings"

	"github.com/fastly/compute-sdk-go/fsthttp"
	"meet/handlers"
)

func main() {
	fsthttp.ServeFunc(func(ctx context.Context, w fsthttp.ResponseWriter, r *fsthttp.Request) {
		// Enable CORS for all routes
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(fsthttp.StatusOK)
			return
		}

		// Route requests
		path := r.URL.Path
		switch {
		case path == "/api/token":
			handlers.HandleToken(ctx, w, r)
		case path == "/api/remove-participant":
			handlers.HandleRemoveParticipant(ctx, w, r)
		case strings.HasPrefix(path, "/api/"):
			// Unknown API route
			w.WriteHeader(fsthttp.StatusNotFound)
			w.Write([]byte(`{"error":"Not found"}`))
		default:
			// Serve static files
			handlers.HandleStatic(ctx, w, r)
		}
	})
}
