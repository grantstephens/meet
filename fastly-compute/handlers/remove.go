package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/fastly/compute-sdk-go/configstore"
	"github.com/fastly/compute-sdk-go/fsthttp"
	"github.com/livekit/protocol/auth"
	lksdk "github.com/livekit/protocol/livekit"
	"google.golang.org/protobuf/proto"
)

type RemoveParticipantRequest struct {
	RoomName            string `json:"roomName"`
	ParticipantIdentity string `json:"participantIdentity"`
}

type SuccessResponse struct {
	Success bool `json:"success"`
}

func HandleRemoveParticipant(ctx context.Context, w fsthttp.ResponseWriter, r *fsthttp.Request) {
	// Only allow POST requests
	if r.Method != "POST" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed"})
		return
	}

	// Parse request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to read request body"})
		return
	}

	var req RemoveParticipantRequest
	if err := json.Unmarshal(body, &req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid JSON"})
		return
	}

	// Validate parameters
	if req.RoomName == "" || req.ParticipantIdentity == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusBadRequest)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Missing roomName or participantIdentity"})
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

	// Create admin token for authentication
	at := auth.NewAccessToken(apiKey, apiSecret)
	at.AddGrant(&auth.VideoGrant{
		RoomAdmin: true,
		Room:      req.RoomName,
	})
	at.SetValidFor(5 * time.Minute)
	token, err := at.ToJWT()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create auth token"})
		return
	}

	// Create protobuf request
	protoReq := &lksdk.RoomParticipantIdentity{
		Room:     req.RoomName,
		Identity: req.ParticipantIdentity,
	}
	reqBody, err := proto.Marshal(protoReq)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to encode request"})
		return
	}

	// Make request to LiveKit using Fastly backend
	apiURL := fmt.Sprintf("%s/twirp/livekit.RoomService/RemoveParticipant", livekitURL)
	apiReq, err := fsthttp.NewRequest("POST", apiURL, bytes.NewReader(reqBody))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to create API request"})
		return
	}

	apiReq.Header.Set("Content-Type", "application/protobuf")
	apiReq.Header.Set("Authorization", "Bearer "+token)

	// Send request using Fastly backend
	resp, err := apiReq.Send(ctx, "livekit_backend")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to remove participant"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(fsthttp.StatusInternalServerError)
		json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to remove participant"})
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(fsthttp.StatusOK)
	json.NewEncoder(w).Encode(SuccessResponse{Success: true})
}
