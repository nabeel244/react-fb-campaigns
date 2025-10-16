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
  const daysBack = urlParams.get("days") || "30"; // Default to 30 days, can be customized

  console.log("Ad Account ID:", adAccountId); // Log the Ad Account ID
  console.log("Campaign ID:", campaignId);   // Log the Campaign ID

  if (!adAccountId || !campaignId) {
    return new Response(JSON.stringify({ error: "Ad account ID or Campaign ID is missing" }), { status: 400 });
  }

  try {
    const accessToken = session.accessToken;
    console.log("Access Token:", accessToken ? "Present" : "Missing");

    // Fetch campaign insights with comprehensive fields
    console.log("Fetching campaign insights...");
    let insightsResponse;
    try {
      // Get current date and 30 days ago for date range
      // Use US Eastern Time (Facebook's primary timezone) to avoid timezone issues
      const now = new Date();
      
      // Convert to US Eastern Time (UTC-5 or UTC-4 depending on DST)
      const usEasternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const endDate = usEasternTime.toISOString().split('T')[0]; // Today in YYYY-MM-DD format (US Eastern)
      const startDate = new Date(usEasternTime.getTime() - parseInt(daysBack) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // X days ago (US Eastern)
      
      console.log(`📅 Fetching campaign data for last ${daysBack} days: ${startDate} to ${endDate} (US Eastern Time)`);
      console.log(`🌍 Your timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
      console.log(`🇺🇸 US Eastern time: ${usEasternTime.toISOString()}`);
      console.log(`🕐 Your local time: ${now.toISOString()}`);
      
      insightsResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?fields=clicks,impressions,spend,cpc,cpm,campaign_name,conversion_rate_ranking,conversion_values,conversions,cost_per_estimated_ad_recallers,cost_per_conversion,cost_per_action_type,cost_per_unique_click,cost_per_unique_outbound_click,ctr,cpp,objective,social_spend,quality_ranking,reach,frequency,ad_name,adset_name,cost_per_purchase,website_purchase_roas,actions,action_values,outbound_clicks,outbound_clicks_ctr,unique_clicks,unique_ctr,unique_outbound_clicks,unique_outbound_clicks_ctr,inline_link_clicks,inline_post_engagement&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      console.log("Insights response received:", insightsResponse.data);
    } catch (error) {
      console.error("Error fetching campaign insights:", error.response?.data || error.message);
      return new Response(JSON.stringify({ 
        error: "Failed to fetch campaign insights", 
        details: error.response?.data || error.message 
      }), { status: 500 });
    }

    // Fetch Ad Set Details (targeting, location, and audience)
    console.log("Fetching ad sets...");
    let adSetData = [];
    try {
    const adSetResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/adsets?fields=name,targeting,optimization_goal,bid_amount,location,audience,age,gender,interests&access_token=${accessToken}`
      );
      adSetData = adSetResponse.data.data;
      console.log("Ad sets fetched successfully");
    } catch (error) {
      console.error("Error fetching ad sets:", error.response?.data || error.message);
    }

    // Fetch strategy data
    console.log("Fetching strategy data...");
    let strategyData = {};
    try {
    const strategyResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}?fields=objective,last_budget_toggling_time,created_time,can_use_spend_cap,campaign_group_active_time,buying_type,issues_info,pacing_type,primary_attribution,promoted_object,smart_promotion_type,source_campaign,spend_cap,ad_studies&access_token=${accessToken}`
      );
      strategyData = strategyResponse.data;
      console.log("Strategy data fetched successfully");
    } catch (error) {
      console.error("Error fetching strategy data:", error.response?.data || error.message);
    }

    // Fetch ads data
    console.log("Fetching ads data...");
    let adsData = [];
    let creativeData = null;
    try {
    const adResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/ads?fields=name,creative,objective&access_token=${accessToken}`
      );
      adsData = adResponse.data.data;
      console.log("Ads data fetched successfully");

      // Extract the creative ID and fetch creative data
      if (adsData.length > 0 && adsData[0].creative && adsData[0].creative.id) {
        const creativeId = adsData[0].creative.id;
        console.log("Fetching creative data for ID:", creativeId);
        
        try {
  const creativeResponse = await axios.get(
            `https://graph.facebook.com/v23.0/${creativeId}?fields=body,title,name,object_type,product_data,url_tags&access_token=${accessToken}`
  );
   creativeData = creativeResponse.data;
          console.log("Creative data fetched successfully");
        } catch (error) {
          console.error("Error fetching creative data:", error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error("Error fetching ads data:", error.response?.data || error.message);
}

    const campaignData = insightsResponse.data.data[0];

    if (!campaignData) {
      console.error("No campaign data found in insights response");
      console.error("Insights response data:", insightsResponse.data);
      return new Response(JSON.stringify({ 
        error: "No campaign data found", 
        details: "The campaign may not have any insights data for the specified time range",
        response_data: insightsResponse.data
      }), { status: 404 });
    }

    console.log("Campaign data found:", campaignData.campaign_name);

    // Fetch daily insights
    console.log("Fetching daily insights...");
    let dailyInsights = [];
    try {
    const dailyInsightsResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?time_increment=1&fields=clicks,impressions,spend,cpc,cpm,ctr,reach,frequency,actions&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      dailyInsights = dailyInsightsResponse.data.data;
      console.log("Daily insights fetched successfully");
    } catch (error) {
      console.error("Error fetching daily insights:", error.response?.data || error.message);
    }

    // Fetch platform breakdown
    console.log("Fetching platform breakdown...");
    let platformData = [];
    try {
    const platformBreakdownResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?breakdowns=publisher_platform&fields=clicks,impressions,spend,cpc,cpm,ctr&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      platformData = platformBreakdownResponse.data.data;
      console.log("Platform data fetched successfully");
    } catch (error) {
      console.error("Error fetching platform data:", error.response?.data || error.message);
    }

    // Fetch action types
    console.log("Fetching action types...");
    let actionData = [];
    try {
    const actionTypesResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?fields=actions,action_values&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      actionData = actionTypesResponse.data.data;
      console.log("Action data fetched successfully");
    } catch (error) {
      console.error("Error fetching action data:", error.response?.data || error.message);
    }

    // Fetch demographic data
    console.log("Fetching demographic data...");
    let demographicData = [];
    try {
    const ageGenderResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?breakdowns=age,gender&fields=clicks,impressions,spend&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      demographicData = ageGenderResponse.data.data;
      console.log("Demographic data fetched successfully");
    } catch (error) {
      console.error("Error fetching demographic data:", error.response?.data || error.message);
    }

    // Fetch country data
    console.log("Fetching country data...");
    let countryData = [];
    try {
    const countryResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?breakdowns=country&fields=clicks,impressions,spend&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      countryData = countryResponse.data.data;
      console.log("Country data fetched successfully");
    } catch (error) {
      console.error("Error fetching country data:", error.response?.data || error.message);
    }
    
    // Fetch placement data
    console.log("Fetching placement data...");
    let placementData = [];
    try {
    const placementResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?fields=clicks,impressions,spend,cpc,cpm,ctr&breakdowns=publisher_platform,platform_position&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      placementData = placementResponse.data.data;
      console.log("Placement data fetched successfully");
    } catch (error) {
      console.error("Error fetching placement data:", error.response?.data || error.message);
    }
    
    // Fetch device data
    console.log("Fetching device data...");
    let deviceData = [];
    try {
    const deviceBreakdownResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?breakdowns=device_platform&fields=clicks,impressions,spend,cpc,cpm,ctr&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
      );
      deviceData = deviceBreakdownResponse.data.data;
      console.log("Device data fetched successfully");
    } catch (error) {
      console.error("Error fetching device data:", error.response?.data || error.message);
    }
    
    

    // Return all the campaign data
    return new Response(
      JSON.stringify({
        // Basic Campaign Info
        campaign_name: campaignData.campaign_name,
        objective: campaignData.objective,
        date_start: campaignData.date_start,
        date_stop: campaignData.date_stop,
        
        // Core Metrics
        clicks: campaignData.clicks,
        impressions: campaignData.impressions,
        spend: campaignData.spend,
        cpc: campaignData.cpc,
        cpm: campaignData.cpm,
        ctr: campaignData.ctr,
        cpp: campaignData.cpp,
        reach: campaignData.reach,
        frequency: campaignData.frequency,
        
        // Quality & Performance Rankings
        quality_ranking: campaignData.quality_ranking,
        conversion_rate_ranking: campaignData.conversion_rate_ranking,
        
        // Cost Metrics
        cost_per_action_type: campaignData.cost_per_action_type,
        cost_per_unique_click: campaignData.cost_per_unique_click,
        cost_per_unique_outbound_click: campaignData.cost_per_unique_outbound_click,
        cost_per_conversion: campaignData.cost_per_conversion,
        cost_per_purchase: campaignData.cost_per_purchase,
        
        // Conversion & Value Metrics
        conversions: campaignData.conversions,
        conversion_values: campaignData.conversion_values,
        website_purchase_roas: campaignData.website_purchase_roas,
        
        // Actions & Values
        actions: campaignData.actions,
        action_values: campaignData.action_values,
        
        // Outbound & Link Metrics
        outbound_clicks: campaignData.outbound_clicks,
        outbound_clicks_ctr: campaignData.outbound_clicks_ctr,
        unique_clicks: campaignData.unique_clicks,
        unique_ctr: campaignData.unique_ctr,
        unique_outbound_clicks: campaignData.unique_outbound_clicks,
        unique_outbound_clicks_ctr: campaignData.unique_outbound_clicks_ctr,
        
        // Inline Metrics
        inline_link_clicks: campaignData.inline_link_clicks,
        inline_post_engagement: campaignData.inline_post_engagement,
        
        // Additional Fields
        social_spend: campaignData.social_spend,
        ad_name: campaignData.ad_name,
        adset_name: campaignData.adset_name,
        cost_per_estimated_ad_recallers: campaignData.cost_per_estimated_ad_recallers,
        
        // Breakdown Data
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
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching campaign insights:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
