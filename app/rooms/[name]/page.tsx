'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react';

interface RoomPageProps {
  params: Promise<{ name: string }>;
}

function AdminControls({ isAdmin, roomName }: { isAdmin: boolean; roomName: string }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [showParticipants, setShowParticipants] = useState(false);

  if (!isAdmin) return null;

  const remoteParticipants = participants.filter(p => p.identity !== room.localParticipant.identity);

  const handleRemoveParticipant = async (identity: string) => {
    try {
      const response = await fetch('/api/remove-participant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantIdentity: identity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove participant');
      }

      console.log('Removed participant:', identity);
    } catch (error) {
      console.error('Failed to remove participant:', error);
      alert('Failed to remove participant. Please try again.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 1000,
    }}>
      <button
        onClick={() => setShowParticipants(!showParticipants)}
        style={{
          padding: '0.75rem 1rem',
          background: 'rgba(59, 130, 246, 0.9)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}
      >
        👑 Admin ({remoteParticipants.length} participants)
      </button>

      {showParticipants && (
        <div style={{
          marginTop: '0.5rem',
          background: 'rgba(17, 24, 39, 0.95)',
          borderRadius: '8px',
          padding: '1rem',
          minWidth: '250px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'white' }}>
            Participants
          </h3>
          {remoteParticipants.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#999' }}>
              No other participants
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {remoteParticipants.map((participant) => (
                <div
                  key={participant.identity}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'white' }}>
                    {participant.identity}
                  </span>
                  <button
                    onClick={() => handleRemoveParticipant(participant.identity)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(239, 68, 68, 0.9)',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoomClient({ params }: RoomPageProps) {
  const [roomName, setRoomName] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const participantName = searchParams?.get('name');
  const isAdmin = searchParams?.get('admin') === 'true';
  const [token, setToken] = useState<string>('');
  const [liveKitUrl, setLiveKitUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      console.log('Room params resolved:', resolvedParams);
      setRoomName(resolvedParams.name);

      // Check if participant name is provided after we have the room name
      if (!participantName) {
        console.log('No participant name provided, redirecting to home with room:', resolvedParams.name);
        router.push(`/?room=${encodeURIComponent(resolvedParams.name)}`);
      }
    }).catch((err) => {
      console.error('Error resolving params:', err);
      setError('Failed to load room parameters');
    });
  }, [params, participantName, router]);

  useEffect(() => {
    if (!roomName || !participantName) return;

    const fetchToken = async () => {
      try {
        console.log('Fetching token for room:', roomName, 'participant:', participantName, 'admin:', isAdmin);
        const adminParam = isAdmin ? '&admin=true' : '';
        const response = await fetch(
          `/api/token?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}${adminParam}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Token received, connecting to:', data.url);
        setToken(data.token);
        setLiveKitUrl(data.url);
      } catch (error) {
        console.error('Error fetching token:', error);
        setError(`Failed to get access token: ${error}`);
      }
    };

    fetchToken();
  }, [roomName, participantName, isAdmin]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'white',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!token || !liveKitUrl) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'white'
      }}>
        Loading room...
      </div>
    );
  }

  console.log('Rendering LiveKitRoom component');

  return (
    <LiveKitRoom
      token={token}
      serverUrl={liveKitUrl}
      connect={true}
      video={true}
      audio={true}
      style={{ height: '100vh' }}
    >
      <VideoConference chatMessageFormatter={formatChatMessageLinks} />
      <AdminControls isAdmin={isAdmin} roomName={roomName} />
    </LiveKitRoom>
  );
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'white'
      }}>
        Loading...
      </div>
    }>
      <RoomClient params={params} />
    </Suspense>
  );
}
