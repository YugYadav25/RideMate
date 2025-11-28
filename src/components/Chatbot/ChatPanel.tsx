import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, CloudSun } from 'lucide-react';
import { askGemini, classifyDomain } from '../../utils/geminiChat';
import { geocodePlace, getWeatherForLatLon } from '../../utils/weatherApi';
import { calculateDistance } from '../../utils/osrmDistance';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isWeather?: boolean;
    weatherData?: {
        place: string;
        temp: number;
        condition: string;
        precip: number;
        isForecast: boolean;
        displayDate: string;
        currentTime: string;
    };
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            text: "Hi! How can I help you with RideMate today?",
            sender: 'ai',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleWeatherQuery = async (text: string): Promise<Message | null> => {
        // Simple regex to extract place and potentially time
        // Patterns: "weather in [Place]", "forecast for [Place]", "weather [Place] [Date/Time]"
        const placeMatch = text.match(/weather (?:in|for|at)?\s*([a-zA-Z\s]+)/i) || text.match(/forecast (?:in|for|at)?\s*([a-zA-Z\s]+)/i);

        if (!placeMatch) return null;

        let placeName = placeMatch[1].trim();
        // Cleanup if user added "tomorrow" or "at 5pm" to the place name capture
        // This is a naive cleanup, but works for simple cases
        const timeKeywords = ['tomorrow', 'today', 'next week', 'at', 'on'];
        for (const kw of timeKeywords) {
            const idx = placeName.toLowerCase().indexOf(kw);
            if (idx > 0) {
                placeName = placeName.substring(0, idx).trim();
                break;
            }
        }

        setIsLoading(true);
        try {
            const geo = await geocodePlace(placeName);
            if (!geo) {
                return {
                    id: Date.now().toString(),
                    text: `I couldn't find a place named "${placeName}". Please check the spelling.`,
                    sender: 'ai',
                    timestamp: new Date()
                };
            }

            // Determine date/time
            // Default to now
            let targetDate = new Date();
            const lowerText = text.toLowerCase();

            if (lowerText.includes('tomorrow')) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            // Try to parse time if present (e.g., "at 6pm", "18:00")
            const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const minute = parseInt(timeMatch[2] || '0');
                const meridiem = timeMatch[3]?.toLowerCase();

                if (meridiem === 'pm' && hour < 12) hour += 12;
                if (meridiem === 'am' && hour === 12) hour = 0;

                targetDate.setHours(hour, minute, 0, 0);
            }

            const weather = await getWeatherForLatLon(geo.lat, geo.lon, targetDate, geo.timezone);

            // Helper to title case the user input
            const titleCase = (str: string) => str.replace(/\b\w/g, c => c.toUpperCase());
            const displayPlace = titleCase(placeName);

            if (weather) {
                return {
                    id: Date.now().toString(),
                    text: `Weather for ${displayPlace}`,
                    sender: 'ai',
                    timestamp: new Date(),
                    isWeather: true,
                    weatherData: {
                        place: displayPlace,
                        temp: weather.temperature,
                        condition: weather.condition,
                        precip: weather.precipitation,
                        isForecast: weather.is_forecast,
                        displayDate: weather.display_date,
                        currentTime: weather.current_time
                    }
                };
            } else {
                return {
                    id: Date.now().toString(),
                    text: "Unable to fetch live weather right now — please try again.",
                    sender: 'ai',
                    timestamp: new Date()
                };
            }

        } catch (e) {
            console.error(e);
            return {
                id: Date.now().toString(),
                text: "Sorry, I encountered an error fetching the weather.",
                sender: 'ai',
                timestamp: new Date()
            };
        } finally {
            setIsLoading(false);
        }
    };

    const handleDistanceQuery = async (text: string): Promise<Message | null> => {
        // Regex to capture "distance between A and B" or "distance from A to B"
        const distanceMatch = text.match(/distance (?:between|from)\s+(.+?)\s+(?:and|to)\s+(.+)/i);
        if (!distanceMatch) return null;

        const origin = distanceMatch[1].trim();
        const destination = distanceMatch[2].trim();

        setIsLoading(true);
        try {
            const result = await calculateDistance(origin, destination);
            if (result) {
                return {
                    id: Date.now().toString(),
                    text: `Distance between ${result.origin} and ${result.destination} is ${result.distanceKm} km by road. (Approx. ${Math.round(result.durationMin / 60)}h ${result.durationMin % 60}m)`,
                    sender: 'ai',
                    timestamp: new Date()
                };
            } else {
                // Fallback URL if OSRM fails or places not found
                return {
                    id: Date.now().toString(),
                    text: "I couldn't calculate the exact distance right now. You can check on OSRM or Google Maps.",
                    sender: 'ai',
                    timestamp: new Date()
                };
            }
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();
        const userMessage: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // 1. Classify Domain
            const classification = await classifyDomain(userText);

            if (classification === 'external') {
                const refusalMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "Sorry! I can help only with RideMate, rides, travel, distance, and weather-related questions. Try asking something like 'distance between two places' or 'weather at a location'.",
                    sender: 'ai',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, refusalMsg]);
                setIsLoading(false);
                return;
            }

            // 2. Check for Distance Intent
            if (userText.toLowerCase().includes('distance') || userText.toLowerCase().includes('how far')) {
                const distanceMsg = await handleDistanceQuery(userText);
                if (distanceMsg) {
                    setMessages(prev => [...prev, distanceMsg]);
                    setIsLoading(false);
                    return;
                }
            }

            // 3. Check for Weather Intent
            // We do this if it's classified as domain (since we treat weather as a supported feature)
            // or if the classification was unsure but it looks like weather.
            if (userText.toLowerCase().includes('weather') || userText.toLowerCase().includes('forecast')) {
                const weatherMsg = await handleWeatherQuery(userText);
                if (weatherMsg) {
                    setMessages(prev => [...prev, weatherMsg]);
                    setIsLoading(false);
                    return;
                }
            }

            // 4. Domain Answer via Gemini
            const responseText = await askGemini(userText);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);

        } catch (error) {
            console.error('Failed to get response', error);
            let errorText = "Sorry, I encountered an error. Please try again.";

            if (error instanceof Error) {
                console.error("Error details:", error.message, error.stack);
                if (error.message.includes("API_KEY")) {
                    errorText = "Configuration Error: Gemini API Key is missing or invalid.";
                }
            }

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: errorText,
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: '320px',
                backgroundColor: '#fff',
                boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#000',
                    color: '#fff',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot size={20} />
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>RideMate AI</h2>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    aria-label="Close chat"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    backgroundColor: '#f9f9f9',
                }}
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div
                            style={{
                                padding: '12px 16px',
                                borderRadius: '12px',
                                backgroundColor: msg.sender === 'user' ? '#000' : '#fff',
                                color: msg.sender === 'user' ? '#fff' : '#000',
                                border: msg.sender === 'ai' ? '1px solid #e0e0e0' : 'none',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                borderTopLeftRadius: msg.sender === 'ai' ? '2px' : '12px',
                            }}
                        >
                            {msg.isWeather && msg.weatherData ? (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600 }}>
                                        <CloudSun size={16} />
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>
                                        {msg.weatherData.displayDate} • {msg.weatherData.currentTime}
                                    </div>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {msg.weatherData.temp}°C
                                    </div>
                                    <div style={{ marginBottom: '4px' }}>
                                        {msg.weatherData.condition}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                        Precipitation: {msg.weatherData.precip}mm
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#999', marginTop: '8px', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                                        Source: Open-Meteo
                                    </div>
                                </div>
                            ) : (
                                msg.text
                            )}
                        </div>
                        <span
                            style={{
                                fontSize: '10px',
                                color: '#888',
                                marginTop: '4px',
                                marginLeft: '4px',
                                marginRight: '4px',
                            }}
                        >
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ alignSelf: 'flex-start', padding: '10px', color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
                        AI is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                style={{
                    padding: '16px',
                    borderTop: '1px solid #eee',
                    backgroundColor: '#fff',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                }}
            >
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about safety, routes, weather..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '24px',
                        border: '1px solid #ddd',
                        outline: 'none',
                        fontSize: '14px',
                        backgroundColor: '#f5f5f5',
                    }}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: inputValue.trim() ? '#000' : '#ccc',
                        color: '#fff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: inputValue.trim() ? 'pointer' : 'default',
                        transition: 'background-color 0.2s',
                    }}
                    aria-label="Send message"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatPanel;
