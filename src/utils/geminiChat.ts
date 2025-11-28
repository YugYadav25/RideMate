import { rideApi } from '../services/rides';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

export async function askGemini(message: string, context: string = ""): Promise<string> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return "Please log in to use the AI assistant.";
    }

    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error calling AI API:", error);
    return "I'm having trouble connecting to the server. Please try again later.";
  }
}

export async function classifyDomain(message: string): Promise<"domain" | "external"> {
  // For now, we'll assume all messages are domain-relevant to simplify
  // In a real app, we could have a lightweight classifier or just send everything to backend
  return "domain";
}

export interface VoiceCommandResponse {
  intent: 'BOOK_RIDE' | 'NAVIGATE' | 'UNKNOWN';
  entities?: {
    origin?: string;
    destination?: string;
    date?: string;
    time?: string;
    screen?: string;
  };
  message?: string;
}

export async function parseVoiceCommand(text: string): Promise<VoiceCommandResponse> {
  try {
    const prompt = `
      You are a voice assistant for a ride-sharing app called RideMate.
      Analyze the following user command and extract the intent and entities.
      
      Command: "${text}"
      
      Possible Intents:
      - BOOK_RIDE: User wants to book a ride, find a ride, or go somewhere.
      - NAVIGATE: User wants to go to a specific screen (e.g., dashboard, profile, history).
      - UNKNOWN: Command is not understood or irrelevant.
      
      Return ONLY a JSON object with the following structure (no markdown):
      {
        "intent": "BOOK_RIDE" | "NAVIGATE" | "UNKNOWN",
        "entities": {
          "origin": "extracted origin location (optional)",
          "destination": "extracted destination location (optional)",
          "date": "extracted date (optional)",
          "time": "extracted time (optional)",
          "screen": "extracted screen name (only for NAVIGATE intent)"
        },
        "message": "A short, natural language response to the user confirming the action"
      }
    `;

    const responseText = await askGemini(prompt);

    // Clean up response if it contains markdown code blocks
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error parsing voice command:", error);
    return { intent: 'UNKNOWN', message: "Sorry, I couldn't understand that command." };
  }
}
