const { GoogleGenerativeAI } = require('@google/generative-ai');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Booking = require('../models/Booking');
const { geocode } = require('../utils/geocoding');

class AIService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in environment variables.');
        } else {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }
    }

    async chat(message, userId) {
        if (!this.model) {
            return "I'm sorry, I haven't been fully configured yet (Missing API Key).";
        }

        try {
            // 1. Fetch user context
            const user = await User.findById(userId).select('name role location');
            const userContext = user ? `User: ${user.name} (${user.role})` : 'User: Guest';

            // 2. Define tools (functions) the model can call
            const tools = {
                search_rides: async ({ from, to }) => {
                    console.log(`AI Tool: Searching rides from ${from} to ${to}`);
                    const fromCoords = await geocode(from);
                    const toCoords = await geocode(to);

                    if (!fromCoords || !toCoords) return "I couldn't find those locations.";

                    const rides = await Ride.find({
                        isActive: true,
                        seatsAvailable: { $gt: 0 },
                        startCoordinates: {
                            $near: {
                                $geometry: { type: 'Point', coordinates: [fromCoords.lng, fromCoords.lat] },
                                $maxDistance: 50000 // 50km
                            }
                        }
                    }).limit(5).populate('driver', 'name rating');

                    if (rides.length === 0) return "No rides found matching that route.";

                    return rides.map(r =>
                        `Ride from ${r.from} to ${r.to} with ${r.driver.name} ($${r.price}) on ${r.date} at ${r.time}`
                    ).join('\n');
                },

                get_my_bookings: async () => {
                    console.log(`AI Tool: Fetching bookings for ${userId}`);
                    const bookings = await Booking.find({ rider: userId }).populate({
                        path: 'ride',
                        select: 'from to date time driver',
                        populate: { path: 'driver', select: 'name' }
                    });

                    if (bookings.length === 0) return "You have no upcoming bookings.";

                    return bookings.map(b =>
                        `Booking: ${b.ride.from} -> ${b.ride.to} on ${b.ride.date} (${b.status})`
                    ).join('\n');
                },

                get_weather: async ({ location }) => {
                    // Placeholder for weather if we had an API
                    return `I can't check real weather yet, but ${location} is usually nice!`;
                }
            };

            // 3. Construct Prompt with Function Definitions
            // Note: For simplicity in this "Flash" model integration without full function calling API complexity,
            // we will use a "ReAct" style prompt or simple tool description.
            // Ideally, we use the `tools` parameter in `generateContent` if supported by the specific SDK version/model.
            // Here we will use a robust system prompt for stability.

            const systemPrompt = `
        You are RideMate AI, a helpful assistant for a ride-sharing app.
        
        Current User: ${userContext}
        
        You have access to these tools:
        - search_rides(from, to): Search for available rides.
        - get_my_bookings(): List the user's bookings.
        
        If the user asks to find a ride, output JSON: {"tool": "search_rides", "args": {"from": "...", "to": "..."}}
        If the user asks about their bookings, output JSON: {"tool": "get_my_bookings", "args": {}}
        
        Otherwise, just reply normally.
        Do not output markdown code blocks for the JSON, just the raw JSON string if calling a tool.
      `;

            const chat = this.model.startChat({
                history: [
                    { role: "user", parts: [{ text: systemPrompt }] },
                    { role: "model", parts: [{ text: "Understood. I am ready to help." }] }
                ],
            });

            const result = await chat.sendMessage(message);
            const responseText = result.response.text().trim();

            // 4. Check for Tool Calls (JSON parsing)
            if (responseText.startsWith('{') && responseText.endsWith('}')) {
                try {
                    const toolCall = JSON.parse(responseText);
                    if (tools[toolCall.tool]) {
                        const toolResult = await tools[toolCall.tool](toolCall.args);
                        // Feed result back to model
                        const finalResult = await chat.sendMessage(`Tool Output: ${toolResult}. Now answer the user.`);
                        return finalResult.response.text();
                    }
                } catch (e) {
                    console.error("Tool execution failed", e);
                }
            }

            return responseText;

        } catch (error) {
            console.error('AI Service Error:', error);
            return "I'm having trouble connecting to my brain right now. Please try again later.";
        }
    }
}

module.exports = new AIService();
