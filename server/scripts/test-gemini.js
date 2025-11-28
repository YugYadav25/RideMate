require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        console.log('Checking API Key...');
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY is missing in .env file');
            return;
        }

        console.log('API Key found (starts with):', apiKey.substring(0, 5) + '...');

        const genAI = new GoogleGenerativeAI(apiKey);

        const modelName = 'gemini-flash-latest';

        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log('Sending test prompt to Gemini...');
        const result = await model.generateContent('Hello, are you working?');
        const response = await result.response;
        const text = response.text();

        console.log(`✅ Gemini API Response (${modelName}):`, text);

    } catch (error) {
        console.error('❌ Gemini API Error:', error.message);
    }
}

testGemini();
