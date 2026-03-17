package handlers

import (
	"context"
	"embed"
	"mime"
	"path"
	"strings"

	"github.com/fastly/compute-sdk-go/fsthttp"
)

//go:embed static/*
var staticFiles embed.FS

func HandleStatic(ctx context.Context, w fsthttp.ResponseWriter, r *fsthttp.Request) {
	// Strip leading slash and default to index.html
	requestPath := strings.TrimPrefix(r.URL.Path, "/")
	if requestPath == "" {
		requestPath = "index.html"
	}

	// Build full path with static prefix
	fullPath := "static/" + requestPath

	// Try to read file from embedded FS
	content, err := staticFiles.ReadFile(fullPath)
	if err != nil {
		// SPA fallback: serve index.html for client-side routing
		content, err = staticFiles.ReadFile("static/index.html")
		if err != nil {
			w.WriteHeader(fsthttp.StatusNotFound)
			w.Write([]byte("404 Not Found"))
			return
		}
		requestPath = "index.html"
	}

	// Set content type based on file extension
	contentType := getContentType(requestPath)
	w.Header().Set("Content-Type", contentType)

	// Set cache headers
	if strings.Contains(requestPath, "/assets/") {
		// Long cache for hashed assets from Vite
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else {
		// Shorter cache for HTML and other files
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}

	// Write the file content
	w.WriteHeader(fsthttp.StatusOK)
	w.Write(content)
}

func getContentType(filePath string) string {
	ext := path.Ext(filePath)

	// Handle common types explicitly for better compatibility
	switch ext {
	case ".html":
		return "text/html; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".js":
		return "application/javascript; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".svg":
		return "image/svg+xml"
	case ".ico":
		return "image/x-icon"
	case ".woff":
		return "font/woff"
	case ".woff2":
		return "font/woff2"
	case ".ttf":
		return "font/ttf"
	case ".eot":
		return "application/vnd.ms-fontobject"
	default:
		// Fall back to mime.TypeByExtension
		contentType := mime.TypeByExtension(ext)
		if contentType == "" {
			return "application/octet-stream"
		}
		return contentType
	}
}
