import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req) {
  // Configuration: Set to true when using sandbox tokens (bypasses session authentication)
  const USE_SANDBOX_MODE = process.env.USE_SANDBOX_MODE === 'true';
  
  if (!USE_SANDBOX_MODE) {
    const session = await getServerSession(authOptions);
    if (!session || session.provider !== 'google') {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const customerId = urlParams.get("customerId");

  if (!customerId) {
    return new Response(JSON.stringify({ error: "Customer ID is missing" }), { status: 400 });
  }

  try {
    const session = USE_SANDBOX_MODE ? null : await getServerSession(authOptions);
    
    const accessToken = USE_SANDBOX_MODE 
      ? process.env.GOOGLE_SANDBOX_ACCESS_TOKEN
      : session?.accessToken;
    
    console.log(`🔧 Google Access Token: ${USE_SANDBOX_MODE ? 'Using sandbox token for testing' : 'Using session token'}`);

    const customerResourceName = `customers/${customerId}`;

    // Fetch campaigns from the Google Ads account
    const campaignsResponse = await axios.post(
      `https://googleads.googleapis.com/v16/${customerResourceName}:searchStream`,
      {
        query: `
          SELECT 
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.start_date,
            campaign.end_date,
            campaign.bidding_strategy_type,
            campaign_budget.amount_micros,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros
          FROM campaign
          ORDER BY campaign.id DESC
          LIMIT 100
        `
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          'Content-Type': 'application/json',
        }
      }
    );

    const campaigns = campaignsResponse.data.results?.map(result => ({
      id: result.campaign.id.toString(),
      name: result.campaign.name,
      status: result.campaign.status,
      objective: result.campaign.advertisingChannelType,
      startDate: result.campaign.startDate,
      endDate: result.campaign.endDate,
      biddingStrategy: result.campaign.biddingStrategyType,
      budget: result.campaignBudget?.amountMicros ? (result.campaignBudget.amountMicros / 1000000) : 0,
      impressions: result.metrics?.impressions || 0,
      clicks: result.metrics?.clicks || 0,
      cost: result.metrics?.costMicros ? (result.metrics.costMicros / 1000000) : 0,
    })) || [];

    return new Response(JSON.stringify({ data: campaigns }), { status: 200 });
  } catch (error) {
    console.error("Error fetching Google Ads campaigns:", error.response?.data || error.message);
    return new Response(JSON.stringify({ 
      error: error.response?.data?.error?.message || error.message 
    }), { status: 500 });
  }
}

