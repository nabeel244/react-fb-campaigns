import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req) {
  console.log('we are here')
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const adAccountId = urlParams.get("adAccountId");
  const campaignId = urlParams.get("campaignId");

  console.log("Ad Account ID:", adAccountId); // Log the Ad Account ID
  console.log("Campaign ID:", campaignId);   // Log the Campaign ID

  if (!adAccountId || !campaignId) {
    return new Response(JSON.stringify({ error: "Ad account ID or Campaign ID is missing" }), { status: 400 });
  }

  try {
    const accessToken = session.accessToken;

    // Fetch campaign insights (clicks and impressions)
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=clicks,impressions,spend,cpc,cpm&time_range={"since":"2022-10-01","until":"2025-04-18"}&access_token=${accessToken}`
    );

    console.log("Campaign Insights Response:", insightsResponse.data); // Log the insights response

    const campaignData = insightsResponse.data.data[0];

    if (!campaignData) {
      return new Response(JSON.stringify({ error: "No campaign data found" }), { status: 404 });
    }

    return new Response(
      JSON.stringify({
        clicks: campaignData.clicks,
        impressions: campaignData.impressions,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching campaign insights:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
