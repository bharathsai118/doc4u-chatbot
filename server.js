// Add these lines at the very top
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (your API key)
dotenv.config();

const app = express();
// Use Render's port or 3000 locally
const port = process.env.PORT || 3000;

// Setup middleware
app.use(cors()); // Allow requests from your HTML file
app.use(express.json()); // Allow the server to read JSON

// Add these lines to serve your HTML file
app.use(express.static(__dirname));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chatbot2.html'));
});


// Configure the Google AI client
// Make sure the API key is loaded correctly!
if (!process.env.GOOGLE_API_KEY) {
    console.error("CRITICAL ERROR: GOOGLE_API_KEY environment variable is not set!");
    // In a real deployment, you might want to exit or handle this more gracefully
    // For now, we'll log the error. The API calls will fail.
}
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// This is the endpoint your HTML will call
app.post('/chat', async (req, res) => {
  try {
    // Check if the API key is available before making a call
    if (!process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    // Get the user's message and history from the request
    const { message, history } = req.body;

    // Use the 'gemini-2.5-flash-lite' model for the best free-tier rates
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      // Add a system instruction to give your bot a personality
      systemInstruction: "You are Doc4U, an AI healthcare assistant. You can help with symptom analysis, health advice, emergency guidance, and medication info. Your responses should be formatted like a helpful WhatsApp message, using bold text (*bold*), and emojis. You are not a real doctor and must always remind users to consult a professional for serious issues."
    });

    // Start a chat session with the provided history
    const chat = model.startChat({
      history: history || [],
    });

    // Send the user's new message
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Send the bot's reply back to the frontend
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("Error during /chat processing:", error); // Log the specific error
    // Check if it's an API key error specifically
    if (error.message && error.message.includes("API key not valid")) {
        res.status(401).json({ error: 'Invalid API Key configured on the server.' });
    } else {
        res.status(500).json({ error: 'Failed to generate response' });
    }
  }
});

// Update the listen call to include '0.0.0.0' for Render
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port} or on Render`);
  console.log('Frontend should be accessible from the main URL.');
});