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
    // console.log(adSetData, 'this is ad set response')

    const strategyResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}?fields=objective,last_budget_toggling_time,created_time,can_use_spend_cap,campaign_group_active_time,buying_type,issues_info,pacing_type,primary_attribution,promoted_object,smart_promotion_type,source_campaign,spend_cap,ad_studies&access_token=${accessToken}`
    );

    // console.log(strategyResponse, 'this is strategy response')

    const strategyData = strategyResponse.data;
      console.log(strategyData, 'this is strategy response')

    const adResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/ads?fields=name,creative,objective&access_token=${accessToken}`
    );
    
    const adsData = adResponse.data.data;
  
    // Extract the creative ID
const creativeId = adsData[0].creative.id; // Get the first ad's creative ID

// Proceed to fetch detailed creative data
let creativeData = null; // Initialize creativeData variable
if (creativeId) {
  // Fetch creative details using the creative ID
  const creativeResponse = await axios.get(
    `https://graph.facebook.com/v19.0/${creativeId}?fields=body,title,name,object_type,product_data,url_tags&access_token=${accessToken}`
  );
  
   creativeData = creativeResponse.data;
}

    const campaignData = insightsResponse.data.data[0];


    if (!campaignData) {
      return new Response(JSON.stringify({ error: "No campaign data found" }), { status: 404 });
    }

    const dailyInsightsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?time_increment=1&fields=clicks,impressions,spend,cpc,cpm,ctr,reach,frequency,actions&access_token=${accessToken}`
    );
    const dailyInsights = dailyInsightsResponse.data.data;

    const platformBreakdownResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?breakdowns=publisher_platform&fields=clicks,impressions,spend,cpc,cpm,ctr&access_token=${accessToken}`
    );
    const platformData = platformBreakdownResponse.data.data;


    const actionTypesResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=actions,action_values&access_token=${accessToken}`
    );
    const actionData = actionTypesResponse.data.data;

    const ageGenderResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?breakdowns=age,gender&fields=clicks,impressions,spend&access_token=${accessToken}`
    );
    const demographicData = ageGenderResponse.data.data;

    const countryResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?breakdowns=country&fields=clicks,impressions,spend&access_token=${accessToken}`
    );
    const countryData = countryResponse.data.data;
    
    const placementResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?fields=clicks,impressions,spend,cpc,cpm,ctr&breakdowns=publisher_platform,platform_position&access_token=${accessToken}`
    );
    const placementData = placementResponse.data.data;
    console.log(placementData, 'this is placement data')
    
    const deviceBreakdownResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${campaignId}/insights?breakdowns=device_platform&fields=clicks,impressions,spend,cpc,cpm,ctr&access_token=${accessToken}`
    );
    const deviceData = deviceBreakdownResponse.data.data;
    
    

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
        ad_sets: adSetData,
        creative_data: creativeData,
        strategy_data: strategyData,
        daily_insights: dailyInsights,
        platform_data: platformData,
        action_data: actionData,
        demographic_data: demographicData,
        country_data: countryData,
        placement_data: placementData,
        device_data: deviceData,


        // Ad Set Details (Targeting, Location, Audience, etc.)
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching campaign insights:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
