import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';

interface Message {
    id: string;
    text: string;
    sender: string;
    timestamp: number;
}

export default function ChatPanel({ yChat, currentUserId }: { yChat: Y.Array<any> | undefined, currentUserId: string }) {
    // Current chat messages we show on screen
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!yChat) return;

        // Sync local state when the shared Yjs array changes
        const handleChange = () => {
            setMessages(yChat.toArray());
        };

        yChat.observe(handleChange);
        setMessages(yChat.toArray()); // Load initial messages

        return () => yChat.unobserve(handleChange);
    }, [yChat]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !yChat) return;

        // Create a simple message object
        const newMessage: Message = {
            id: Date.now().toString(), // Simple unique ID
            text: inputText.trim(),
            sender: currentUserId,
            timestamp: Date.now()
        };

        // Push to the shared Yjs array! Everyone will see this immediately.
        yChat.push([newMessage]);
        setInputText('');
    };

    return (
        <div style={{
            width: '300px',
            height: '400px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)', // Glassmorphism effect!
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.05)',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ fontSize: '18px' }}>💬</span> Board Chat
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}
            >
                {messages.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontSize: '13px',
                        marginTop: '20px',
                        fontStyle: 'italic'
                    }}>
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} style={{
                            alignSelf: msg.sender === currentUserId ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                color: '#64748b',
                                marginBottom: '2px',
                                marginLeft: msg.sender === currentUserId ? '0' : '4px',
                                textAlign: msg.sender === currentUserId ? 'right' : 'left'
                            }}>
                                {msg.sender === currentUserId ? 'You' : `User ${msg.sender}`}
                            </div>
                            <div style={{
                                background: msg.sender === currentUserId ? '#4f46e5' : '#f1f5f9',
                                color: msg.sender === currentUserId ? 'white' : '#1e293b',
                                padding: '8px 12px',
                                borderRadius: msg.sender === currentUserId ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                fontSize: '13px',
                                lineHeight: '1.4',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} style={{
                padding: '12px',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '8px'
            }}>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                    type="submit"
                    style={{
                        background: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
}
