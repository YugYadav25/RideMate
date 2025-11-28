import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
    isVoiceCommandMode: boolean;
    toggleVoiceCommandMode: () => void;
    isSeniorMode: boolean;
    toggleSeniorMode: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isVoiceCommandMode, setIsVoiceCommandMode] = useState<boolean>(() => {
        const savedMode = localStorage.getItem('voiceCommandMode');
        return savedMode === 'true';
    });

    const [isSeniorMode, setIsSeniorMode] = useState<boolean>(() => {
        const savedMode = localStorage.getItem('seniorMode');
        return savedMode === 'true';
    });

    useEffect(() => {
        localStorage.setItem('voiceCommandMode', String(isVoiceCommandMode));
    }, [isVoiceCommandMode]);

    useEffect(() => {
        localStorage.setItem('seniorMode', String(isSeniorMode));
    }, [isSeniorMode]);

    const toggleVoiceCommandMode = () => {
        setIsVoiceCommandMode((prev) => !prev);
    };

    const toggleSeniorMode = () => {
        setIsSeniorMode((prev) => !prev);
    };

    return (
        <AccessibilityContext.Provider value={{
            isVoiceCommandMode,
            toggleVoiceCommandMode,
            isSeniorMode,
            toggleSeniorMode
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
};

export const useAccessibility = (): AccessibilityContextType => {
    const context = useContext(AccessibilityContext);
    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
};
