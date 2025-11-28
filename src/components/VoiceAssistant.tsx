import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useApp } from '../context/AppContext';
import { askGemini } from '../utils/geminiChat';

const VoiceAssistant: React.FC = () => {
    const { isVoiceCommandMode } = useAccessibility();
    const { navigateTo } = useApp();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const recognitionRef = useRef<any>(null);
    const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleVoiceCommand(text);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);

                let errorMessage = "I didn't catch that. Please try again.";
                if (event.error === 'not-allowed') {
                    errorMessage = "Microphone access denied. Please enable permissions.";
                } else if (event.error === 'no-speech') {
                    errorMessage = "No speech detected. Please speak louder.";
                } else if (event.error === 'network') {
                    errorMessage = "Network error. Check your connection.";
                }

                setResponse(errorMessage);
                speak(errorMessage);
            };
        } else {
            console.warn('Speech recognition not supported');
        }
    }, []);

    const startListening = () => {
        if (recognitionRef.current) {
            setIsListening(true);
            setTranscript('');
            setResponse('');
            setIsOpen(true);
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Error starting recognition:", e);
            }
        } else {
            alert('Voice recognition is not supported in this browser.');
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    const speak = (text: string) => {
        if (synthRef.current) {
            setIsSpeaking(true);
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => setIsSpeaking(false);
            synthRef.current.speak(utterance);
        }
    };

    const handleVoiceCommand = async (text: string) => {
        try {
            // 1. Parse command using Gemini
            setResponse("Processing...");
            const command = await import('../utils/geminiChat').then(m => m.parseVoiceCommand(text));

            if (command.message) {
                speak(command.message);
                setResponse(command.message);
            }

            if (command.intent === 'BOOK_RIDE') {
                const { origin, destination } = command.entities || {};

                if (origin && destination) {
                    // Geocode locations
                    const [originGeo, destGeo] = await Promise.all([
                        import('../utils/weatherApi').then(m => m.geocodePlace(origin)),
                        import('../utils/weatherApi').then(m => m.geocodePlace(destination))
                    ]);

                    if (originGeo && destGeo) {
                        setTimeout(() => {
                            setIsOpen(false);
                            navigateTo('search-ride', {
                                startLocation: { name: originGeo.name, lat: originGeo.lat, lng: originGeo.lon },
                                destinationLocation: { name: destGeo.name, lat: destGeo.lat, lng: destGeo.lon },
                                autoSearch: true
                            });
                        }, 2000);
                    } else {
                        const errorMsg = "I couldn't find one of those locations. Please try again.";
                        speak(errorMsg);
                        setResponse(errorMsg);
                    }
                } else {
                    // If locations are missing, just go to search
                    setTimeout(() => {
                        setIsOpen(false);
                        navigateTo('search-ride');
                    }, 2000);
                }
            } else if (command.intent === 'NAVIGATE') {
                const screen = command.entities?.screen?.toLowerCase();
                if (screen) {
                    setTimeout(() => {
                        setIsOpen(false);
                        if (screen.includes('dashboard')) navigateTo('dashboard');
                        else if (screen.includes('history')) navigateTo('ride-history');
                        else if (screen.includes('profile')) navigateTo('profile');
                        else if (screen.includes('create')) navigateTo('create-ride');
                        else navigateTo('dashboard'); // Default
                    }, 2000);
                }
            } else {
                // Fallback to normal chat if unknown intent
                const aiResponse = await askGemini(text);
                const cleanResponse = aiResponse.replace(/\*/g, '');
                setResponse(cleanResponse);
                speak(cleanResponse);
            }

        } catch (error) {
            console.error('Error processing voice command:', error);
            setResponse('Sorry, something went wrong.');
            speak('Sorry, something went wrong.');
        }
    };

    if (!isVoiceCommandMode) return null;

    return (
        <>
            {/* Floating Mic Button - Moved to LEFT */}
            <button
                onClick={startListening}
                className="fixed bottom-8 left-8 z-50 w-20 h-20 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform border-4 border-white"
                aria-label="Voice Assistant"
            >
                <Mic size={40} />
            </button>

            {/* Voice Interface Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg text-center relative animate-slide-in">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
                        >
                            <X size={32} />
                        </button>

                        <div className="mb-8 flex justify-center">
                            <div className={`p-6 rounded-full ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-black'}`}>
                                {isListening ? <Mic size={64} /> : <Volume2 size={64} />}
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold mb-4">
                            {isListening ? "Listening..." : "I'm here to help"}
                        </h2>

                        {transcript && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                                <p className="text-xl text-gray-600">"{transcript}"</p>
                            </div>
                        )}

                        {response && (
                            <div className="mb-8">
                                <p className="text-2xl font-medium text-black">{response}</p>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            {isListening ? (
                                <button
                                    onClick={stopListening}
                                    className="px-8 py-4 bg-red-500 text-white text-xl font-bold rounded-xl hover:bg-red-600 transition-colors"
                                >
                                    Stop Listening
                                </button>
                            ) : (
                                <button
                                    onClick={startListening}
                                    className="px-8 py-4 bg-black text-white text-xl font-bold rounded-xl hover:bg-gray-800 transition-colors"
                                >
                                    Speak Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VoiceAssistant;
