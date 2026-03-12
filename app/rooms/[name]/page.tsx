'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LiveKitRoom,
  VideoConference,
  formatChatMessageLinks,
} from '@livekit/components-react';

interface RoomPageProps {
  params: Promise<{ name: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const [roomName, setRoomName] = useState<string>('');
  const searchParams = useSearchParams();
  const participantName = searchParams?.get('name') || 'Guest';
  const [token, setToken] = useState<string>('');
  const [liveKitUrl, setLiveKitUrl] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setRoomName(resolvedParams.name);
    });
  }, [params]);

  useEffect(() => {
    if (!roomName) return;

    const fetchToken = async () => {
      try {
        const response = await fetch(
          `/api/token?roomName=${encodeURIComponent(roomName)}&participantName=${encodeURIComponent(participantName)}`
        );
        const data = await response.json();
        setToken(data.token);
        setLiveKitUrl(data.url);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, [roomName, participantName]);

  if (!token || !liveKitUrl) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'white'
      }}>
        Loading...
      </div>
    );
  }

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
