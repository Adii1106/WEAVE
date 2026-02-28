import { useState, useMemo } from 'react';
import { Tldraw, type TLAsset } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import LandingPage from './components/LandingPage';
import { useYjsStore } from './useYjsStore';

export default function App() {
  const [userName, setUserName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [inSession, setInSession] = useState(false);

  // This connects us to the sharing network
  const storeWithStatus = useYjsStore({
    roomId: sessionId,
    hostUrl: 'ws://localhost:5001' // Our local signaling server
  });

  const handleJoinSession = (name: string, session: string) => {
    setUserName(name);
    setSessionId(session);
    setInSession(true);
  };

  const handleExit = () => {
    setInSession(false);
    setSessionId('');
  };

  // This handles uploading images to our server
  // We need this because WebRTC is too slow for big files
  const imageService = useMemo(() => {
    return {
      upload: async (_asset: TLAsset, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
          // Upload to our Express backend
          const response = await fetch('http://localhost:5002/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Upload failed');

          const data = await response.json();
          return { src: data.url }; // Return the URL for everyone else to see
        } catch (e) {
          console.error('Upload error:', e);
          throw e;
        }
      },
      resolve: (asset: TLAsset) => {
        return asset.props.src;
      }
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      {!inSession ? (
        <LandingPage onJoinSession={handleJoinSession} />
      ) : (
        <>
          {/* Simple header to show session info */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: '#1e293b',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontFamily: 'sans-serif',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            whiteSpace: 'nowrap'
          }}>
            <button
              onClick={handleExit}
              style={{
                background: '#ef4444',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ← Exit
            </button>

            <span>
              Room: <strong>{sessionId}</strong> |
              User: <strong>{userName}</strong> |
              👥 <strong>{storeWithStatus.peerCount || 1}</strong>
            </span>
          </div>

          {/* Core Whiteboard Component */}
          <Tldraw
            store={storeWithStatus.store}
            autoFocus
            assets={imageService}
          />
        </>
      )}
    </div>
  );
}
