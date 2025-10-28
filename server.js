import express from 'express';
// THIS IS THE CORRECT LINE
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables (your API key)
dotenv.config();

const app = express();
const port = 3000;

// Setup middleware
app.use(cors()); // Allow requests from your HTML file
app.use(express.json()); // Allow the server to read JSON

// Configure the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// This is the endpoint your HTML will call
app.post('/chat', async (req, res) => {
  try {
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
    console.error(error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Your frontend (chatbot2.html) can now send requests to this server.');
});