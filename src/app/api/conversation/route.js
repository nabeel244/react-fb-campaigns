// /src/app/api/openai/conversation/route.js

import { OpenAI } from "openai";  // Ensure you're using the correct import

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Ensure your OpenAI API key is set correctly
});

export async function POST(req) {
  const { conversationHistory } = await req.json();  // Extract conversation data from the body

  if (!conversationHistory || conversationHistory.length === 0) {
    return new Response(JSON.stringify({ error: "No conversation history provided." }), { status: 400 });
  }

  try {
    // Request a response from OpenAI API with the conversation history
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // or use "gpt-4" if available
      messages: conversationHistory,  // Pass the entire conversation history
    });

    // Send the response back to the frontend
    const suggestion = response.choices[0].message.content.trim();
    return new Response(JSON.stringify({ response: suggestion }), { status: 200 });
  } catch (error) {
    console.error("Error communicating with OpenAI:", error);
    return new Response(JSON.stringify({ error: "Failed to get suggestions from OpenAI." }), { status: 500 });
  }
}
