'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams?.get('room');
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');

  useEffect(() => {
    if (roomParam) {
      setRoomName(roomParam);
    }
  }, [roomParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName && participantName) {
      // If no room parameter exists, user is creating a new room and becomes admin
      const isCreatingRoom = !roomParam;
      const adminParam = isCreatingRoom ? '&admin=true' : '';
      router.push(`/rooms/${encodeURIComponent(roomName)}?name=${encodeURIComponent(participantName)}${adminParam}`);
    }
  };

  const handleCreateRoom = () => {
    const randomRoom = `room-${Math.random().toString(36).substring(7)}`;
    setRoomName(randomRoom);
  };

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Meet</h1>
          <p style={{ color: '#999' }}>Simple video conferencing powered by LiveKit</p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label htmlFor="participantName" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Your Name
              </label>
              <input
                type="text"
                id="participantName"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem'
                }}
                placeholder="Enter your name"
                required
              />
            </div>

            {roomParam ? (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Joining Room
                </label>
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem'
                }}>
                  {roomParam}
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="roomName" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Room Name
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter room name"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Generate
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '1rem',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Join Room
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#999' }}>
            <p>{roomParam ? 'Enter your name to join this room' : 'Anyone with the room URL can join'}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
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
      <HomeContent />
    </Suspense>
  );
}
