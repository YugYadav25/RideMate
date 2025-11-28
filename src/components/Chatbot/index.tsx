import React, { useState } from 'react';
import ChatButton from './ChatButton';
import ChatPanel from './ChatPanel';

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            <ChatButton onClick={toggleChat} isOpen={isOpen} />
            <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};

export default Chatbot;
