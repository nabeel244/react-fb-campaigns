import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req) {
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

    // Fetch campaign insights with all requested fields
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=clicks,impressions,spend,cpc,cpm,campaign_name,conversion_rate_ranking,conversion_values,conversions,cost_per_estimated_ad_recallers,cost_per_conversion,cost_per_action_type,cost_per_unique_click,cost_per_unique_outbound_click,ctr,cpp,objective,social_spend,quality_ranking,reach,frequency,ad_name,adset_name,cost_per_purchase&time_range={"since":"2022-10-01","until":"2025-04-18"}&access_token=${accessToken}`
    );

    // Fetch Ad Set Details (targeting, location, and audience)
    const adSetResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/adsets?fields=name,targeting,optimization_goal,bid_amount,location,audience,age,gender,interests&access_token=${accessToken}`
    );


    const adSetData = adSetResponse.data.data;
    console.log(adSetData, 'this is ad set response')


    // Get Ads Data (Creative, Placement, etc.)
    // const adResponse = await axios.get(
    //   `https://graph.facebook.com/v19.0/${campaignId}/ads?fields=name,adset_id,creative,placement,objective,status&access_token=${accessToken}`
    // );
    // const adsData = adResponse.data.data;
    // console.log(adsData, 'this is ad response')


    // Get Detailed Campaign Info (Objective, Buying Type, Status)
    // const campaignDetailsResponse = await axios.get(
    //   `https://graph.facebook.com/v19.0/${campaignId}?fields=id,name,status,objective,buying_type,start_time,end_time&access_token=${accessToken}`
    // );

    // // Log the insights response
    // console.log(campaignDetailsResponse, 'this is campaign response')

    const campaignData = insightsResponse.data.data[0];


    if (!campaignData) {
      return new Response(JSON.stringify({ error: "No campaign data found" }), { status: 404 });
    }

    // Return all the campaign data
    return new Response(
      JSON.stringify({
        clicks: campaignData.clicks,
        impressions: campaignData.impressions,
        spend: campaignData.spend,
        cpc: campaignData.cpc,
        cpm: campaignData.cpm,
        campaign_name: campaignData.campaign_name,
        conversion_rate_ranking: campaignData.conversion_rate_ranking,
        cost_per_action_type: campaignData.cost_per_action_type,  // Array field
        cost_per_unique_click: campaignData.cost_per_unique_click,
        cost_per_unique_outbound_click: campaignData.cost_per_unique_outbound_click,  // Array field
        ctr: campaignData.ctr,
        cpp: campaignData.cpp,
        objective: campaignData.objective,
        social_spend: campaignData.social_spend,
        quality_ranking: campaignData.quality_ranking,
        reach: campaignData.reach,
        frequency: campaignData.frequency,
        date_start: campaignData.date_start,  // Date fields
        date_stop: campaignData.date_stop,
        ad_sets: adSetData


        // Ad Set Details (Targeting, Location, Audience, etc.)
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching campaign insights:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
