import React from 'react';


interface ChatButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick, isOpen }) => {
    if (isOpen) return null; // Hide button when panel is open

    return (
        <>
            <style>
                {`
                @keyframes pulse-black {
                    0% {
                        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
                    }
                    70% {
                        box-shadow: 0 0 0 15px rgba(0, 0, 0, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
                    }
                }
                .chat-btn-pulse {
                    animation: pulse-black 2s infinite;
                }
                `}
            </style>
            <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                    style={{
                        backgroundColor: 'black',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        opacity: 0,
                        transform: 'translateX(10px)',
                        transition: 'opacity 0.3s, transform 0.3s',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap'
                    }}
                    className="chat-tooltip"
                >
                    Chat with AI
                </div>
                <button
                    onClick={onClick}
                    className="chat-btn-pulse"
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#fff',
                        border: '3px solid #000',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'transform 0.2s ease',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        const tooltip = e.currentTarget.parentElement?.querySelector('.chat-tooltip') as HTMLElement;
                        if (tooltip) {
                            tooltip.style.opacity = '1';
                            tooltip.style.transform = 'translateX(0)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        const tooltip = e.currentTarget.parentElement?.querySelector('.chat-tooltip') as HTMLElement;
                        if (tooltip) {
                            tooltip.style.opacity = '0';
                            tooltip.style.transform = 'translateX(10px)';
                        }
                    }}
                    aria-label="Open AI Assistant"
                >
                    <img
                        src="/ridemate_logo.png"
                        alt="RideMate AI"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                </button>
            </div>
        </>
    );
};

export default ChatButton;
