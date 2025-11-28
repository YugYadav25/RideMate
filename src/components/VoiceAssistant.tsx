import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, X } from 'lucide-react';
// import { useAccessibility } from '../context/AccessibilityContext';
import { useApp } from '../context/AppContext';
import { askGemini } from '../utils/geminiChat';

const VoiceAssistant: React.FC = () => {
    // const { isVoiceCommandMode } = useAccessibility();
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

    const normalizeTime = (timeStr?: string): string | undefined => {
        if (!timeStr) return undefined;

        // Remove any non-time characters (like "approx", "around")
        let cleanTime = timeStr.toLowerCase().replace(/[^0-9:apm\s]/g, '').trim();

        // Handle AM/PM
        if (cleanTime.includes('pm') || cleanTime.includes('am')) {
            const isPM = cleanTime.includes('pm');
            cleanTime = cleanTime.replace(/(am|pm)/, '').trim();
            let [hours, minutes] = cleanTime.split(':').map(Number);

            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;

            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        // Assume 24h if no AM/PM
        const [hours, minutes] = cleanTime.split(':');
        if (hours && minutes) {
            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }

        return timeStr;
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
                const normalizedTime = normalizeTime(command.entities?.time);

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
                                date: command.entities?.date,
                                time: normalizedTime,
                                seats: command.entities?.seats,
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
            } else if (command.intent === 'OFFER_RIDE') {
                const { origin, destination } = command.entities || {};
                const normalizedTime = normalizeTime(command.entities?.time);

                if (origin && destination) {
                    // Geocode locations
                    const [originGeo, destGeo] = await Promise.all([
                        import('../utils/weatherApi').then(m => m.geocodePlace(origin)),
                        import('../utils/weatherApi').then(m => m.geocodePlace(destination))
                    ]);

                    if (originGeo && destGeo) {
                        setTimeout(() => {
                            setIsOpen(false);
                            navigateTo('create-ride', {
                                startLocation: { name: originGeo.name, lat: originGeo.lat, lng: originGeo.lon },
                                destinationLocation: { name: destGeo.name, lat: destGeo.lat, lng: destGeo.lon },
                                date: command.entities?.date,
                                time: normalizedTime,
                                seats: command.entities?.seats
                            });
                        }, 2000);
                    } else {
                        const errorMsg = "I couldn't find one of those locations. Please try again.";
                        speak(errorMsg);
                        setResponse(errorMsg);
                    }
                } else {
                    // If locations are missing, just go to create-ride
                    setTimeout(() => {
                        setIsOpen(false);
                        navigateTo('create-ride');
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

    // if (!isVoiceCommandMode) return null; // Always active now

    return (
        <>
            {/* Voice Interface - Non-intrusive Popover */}
            <div className={`fixed bottom-28 left-8 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-80 border border-gray-200 dark:border-gray-700 relative">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center gap-4">
                        <div className={`p-4 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : response.includes('Error') || response.includes('denied') ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-black'}`}>
                            {isListening ? <Mic size={32} /> : <Volume2 size={32} />}
                        </div>

                        <div className="text-center w-full">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">
                                {isListening ? "Listening..." : isSpeaking ? "Speaking..." : response.includes('Error') ? "Error" : "How can I help?"}
                            </h3>

                            {(transcript || response) && (
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto text-sm">
                                    {transcript && <p className="text-gray-500 italic mb-2">"{transcript}"</p>}
                                    {response && <p className={response.includes('Error') || response.includes('denied') ? "text-red-600 font-medium" : "text-gray-800 dark:text-gray-200"}>{response}</p>}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 w-full">
                            {isListening ? (
                                <button
                                    onClick={stopListening}
                                    className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                                >
                                    Stop
                                </button>
                            ) : (
                                <button
                                    onClick={startListening}
                                    className={`flex-1 py-2 ${response.includes('Error') ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'} text-white rounded-lg text-sm font-medium`}
                                >
                                    {response.includes('Error') ? 'Retry' : 'Speak'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Mic Button */}
            <button
                onClick={() => {
                    if (!isOpen) {
                        setIsOpen(true);
                        startListening();
                    } else {
                        setIsOpen(false);
                        stopListening();
                    }
                }}
                className={`fixed bottom-8 left-8 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${isListening
                    ? 'bg-red-500 text-white scale-110 animate-pulse'
                    : 'bg-black text-white hover:bg-gray-800 hover:scale-105'
                    }`}
                aria-label="Voice Assistant"
            >
                {isOpen ? <X size={32} /> : <Mic size={32} />}
            </button>
        </>
    );
};

export default VoiceAssistant;
