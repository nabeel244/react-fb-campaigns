import { OpenAI } from "openai";  // Import the OpenAI SDK

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  // Make sure your OpenAI API key is in your environment variables
});

export async function GET(req) {
  const urlParams = new URLSearchParams(req.url.split('?')[1]);

  // Extract query parameters
  const campaignName = urlParams.get("campaignName");
  const clicks = urlParams.get("clicks");
  const impressions = urlParams.get("impressions");
  const status = urlParams.get("status");
  const objective = urlParams.get("objective");

  console.log("Received Request for OpenAI Suggestion");
  console.log("Campaign Name:", campaignName);
  console.log("Campaign Clicks:", clicks);
  console.log("Campaign Impressions:", impressions);
  console.log("Campaign Status:", status);
  console.log("Campaign Objective:", objective);

  // Validate the incoming parameters
  // if (!campaignName || !clicks || !impressions || !status || !objective) {
  //   return new Response(
  //     JSON.stringify({ error: "Missing required parameters." }),
  //     { status: 400 }
  //   );
  // }

  try {
    const prompt = `
      I have a campaign named '${campaignName}'. It has ${clicks} clicks and ${impressions} impressions. The campaign is currently ${status}. Its objective is ${objective}. How can I improve this campaign to increase its performance?
    `;

    // Send request to OpenAI API to generate a response based on the prompt
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",  // Use "gpt-4" if needed and available
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant for improving marketing campaigns.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Get the response suggestion
    const suggestion = response.choices[0].message.content.trim();

    // Return the suggestion to the frontend
    return new Response(
      JSON.stringify({ suggestion }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error communicating with OpenAI:", error);

    // Return error if OpenAI request fails
    return new Response(
      JSON.stringify({ error: "Failed to get suggestions from OpenAI." }),
      { status: 500 }
    );
  }
}
