package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/fastly/compute-sdk-go/configstore"
	"github.com/fastly/compute-sdk-go/fsthttp"
	"github.com/livekit/protocol/auth"
)

type TokenResponse struct {
	Token string `json:"token"`
	URL   string `json:"url"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func HandleToken(ctx context.Context, w fsthttp.ResponseWriter, r *fsthttp.Request) {
	// Only allow GET requests
	if r.Method != "GET" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed"})
		return
	}

	// Get query parameters
	roomName := r.URL.Query().Get("roomName")
	participantName := r.URL.Query().Get("participantName")
	isAdmin := r.URL.Query().Get("admin") == "true"

	// Validate parameters
	if roomName == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Missing roomName parameter"})
		return
	}

	if participantName == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Missing participantName parameter"})
		return
	}

	// Get credentials from Fastly Config Store
	store, err := configstore.Open("config")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Server misconfigured"})
		return
	}

	apiKey, err := store.Get("LIVEKIT_API_KEY")
	if err != nil || apiKey == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Server misconfigured"})
		return
	}

	apiSecret, err := store.Get("LIVEKIT_API_SECRET")
	if err != nil || apiSecret == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Server misconfigured"})
		return
	}

	livekitURL, err := store.Get("LIVEKIT_URL")
	if err != nil || livekitURL == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Server misconfigured"})
		return
	}

	// Create access token
	metadata := fmt.Sprintf(`{"isAdmin":%t}`, isAdmin)
	at := auth.NewAccessToken(apiKey, apiSecret)
	at.SetIdentity(participantName)
	at.SetMetadata(metadata)
	at.SetValidFor(24 * time.Hour)

	// Set video grants
	trueVal := true
	grant := &auth.VideoGrant{
		Room:                 roomName,
		RoomJoin:             true,
		CanPublish:           &trueVal,
		CanSubscribe:         &trueVal,
		CanUpdateOwnMetadata: &trueVal,
	}

	// Add admin grant if admin
	if isAdmin {
		grant.RoomAdmin = true
	}

	at.AddGrant(grant)

	// Generate JWT
	jwt, err := at.ToJWT()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Return token response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(fsthttp.StatusOK)
	json.NewEncoder(w).Encode(TokenResponse{
		Token: jwt,
		URL:   livekitURL,
	})
}
