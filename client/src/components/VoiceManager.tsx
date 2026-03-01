import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { WebrtcProvider } from 'y-webrtc';

interface VoiceManagerProps {
    provider: WebrtcProvider | undefined;
    isMuted: boolean;
}

export default function VoiceManager({ provider, isMuted }: VoiceManagerProps) {
    const [streams, setStreams] = useState<{ [id: string]: MediaStream }>({});
    const myStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [id: string]: Peer.Instance }>({});
    const myId = provider?.awareness.clientID.toString();

    useEffect(() => {
        if (!provider || !myId) return;

        const setupMic = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                myStreamRef.current = stream;

                // Set initial mute state
                stream.getAudioTracks().forEach(t => t.enabled = !isMuted);

                const awareness = provider.awareness;

                const handleAwarenessUpdate = () => {
                    const states = awareness.getStates();
                    states.forEach((state: any, clientId: any) => {
                        const peerId = clientId.toString();
                        if (peerId === myId) return;

                        // If they want to talk and we don't have a peer yet
                        if (!peersRef.current[peerId] && state.voiceSignalInit) {
                            initiatePeer(peerId, false);
                        }
                    });
                };

                const initiatePeer = (peerId: string, initiator: boolean) => {
                    if (peersRef.current[peerId]) return;

                    const p = new Peer({
                        initiator,
                        trickle: false,
                        stream: myStreamRef.current!
                    });

                    p.on('signal', (data) => {
                        // Broadcast our signal to this specific peer via awareness
                        // In a real app, we'd use a targeted signal, here we use a simple broadcast
                        awareness.setLocalStateField(`signal_${peerId}`, data);
                        if (initiator) {
                            awareness.setLocalStateField('voiceSignalInit', true);
                        }
                    });

                    p.on('stream', (remoteStream) => {
                        setStreams(prev => ({ ...prev, [peerId]: remoteStream }));
                    });

                    p.on('close', () => {
                        delete peersRef.current[peerId];
                        setStreams(prev => {
                            const newStreams = { ...prev };
                            delete newStreams[peerId];
                            return newStreams;
                        });
                    });

                    peersRef.current[peerId] = p;
                };

                // Trigger initiation for others
                awareness.setLocalStateField('voiceSignalInit', true);

                awareness.on('change', () => {
                    const states = awareness.getStates();
                    states.forEach((state: any, clientId: any) => {
                        const peerId = clientId.toString();
                        if (peerId === myId) return;

                        const incomingSignal = state[`signal_${myId}`];
                        if (incomingSignal && peersRef.current[peerId]) {
                            try {
                                (peersRef.current[peerId] as any).signal(incomingSignal);
                            } catch (e) { }
                        } else if (incomingSignal && !peersRef.current[peerId]) {
                            initiatePeer(peerId, false);
                            (peersRef.current[peerId] as any).signal(incomingSignal);
                        }
                    });
                    handleAwarenessUpdate();
                });

            } catch (err) {
                console.error('Voice access denied:', err);
            }
        };

        setupMic();

        return () => {
            myStreamRef.current?.getTracks().forEach(track => track.stop());
            Object.values(peersRef.current).forEach(p => p.destroy());
        };
    }, [provider, myId]);

    useEffect(() => {
        if (myStreamRef.current) {
            myStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
        }
    }, [isMuted]);

    return (
        <div style={{ display: 'none' }}>
            {Object.entries(streams).map(([id, stream]) => (
                <AudioPlayer key={id} stream={stream} />
            ))}
        </div>
    );
}

function AudioPlayer({ stream }: { stream: MediaStream }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (audioRef.current) audioRef.current.srcObject = stream;
    }, [stream]);
    return <audio ref={audioRef} autoPlay />;
}
