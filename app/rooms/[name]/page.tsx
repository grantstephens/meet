'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
} from '@livekit/components-react';

interface RoomPageProps {
  params: Promise<{ name: string }>;
}

function RoomClient({ params }: RoomPageProps) {
  const [roomName, setRoomName] = useState<string>('');
  const searchParams = useSearchParams();
  const participantName = searchParams?.get('name') || 'Guest';
  const [token, setToken] = useState<string>('');
  const [liveKitUrl, setLiveKitUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      console.log('Room params resolved:', resolvedParams);
      setRoomName(resolvedParams.name);
    }).catch((err) => {
      console.error('Error resolving params:', err);
      setError('Failed to load room parameters');
    });
  }, [params]);

  useEffect(() => {
    if (!roomName) return;

    const fetchToken = async () => {
      try {
        console.log('Fetching token for room:', roomName, 'participant:', participantName);
        const response = await fetch(
          `/api/token?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}`
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
  }, [roomName, participantName]);

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
