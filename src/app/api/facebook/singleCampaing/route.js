import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req) {
  // Configuration: Set to true when using sandbox tokens (bypasses session authentication)
  const USE_SANDBOX_MODE = process.env.USE_SANDBOX_MODE === 'true';
  
  if (!USE_SANDBOX_MODE) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
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
    const session = USE_SANDBOX_MODE ? null : await getServerSession(authOptions);
    
    const accessToken = USE_SANDBOX_MODE 
      ? process.env.SANDBOX_ACCESS_TOKEN
      : session?.accessToken;
    
    console.log(`🔧 Access Token: ${USE_SANDBOX_MODE ? 'Using sandbox token for testing' : 'Using session token'}`);

    // First, fetch the actual campaign details to get real start/stop dates
    console.log("Fetching campaign details (start/stop dates)...");
    let campaignDetails = {};
    try {
      const campaignDetailsResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}?fields=id,name,status,objective,start_time,stop_time,created_time,updated_time&access_token=${accessToken}`
      );
      campaignDetails = campaignDetailsResponse.data;
      console.log("📅 Campaign details fetched:", {
        name: campaignDetails.name,
        status: campaignDetails.status,
        start_time: campaignDetails.start_time,
        stop_time: campaignDetails.stop_time
      });
    } catch (error) {
      console.error("Error fetching campaign details:", error.response?.data || error.message);
    }

    // Get current date and campaign start date for date range
    // Use US Eastern Time (Facebook's primary timezone) to avoid timezone issues
    const now = new Date();
    
    // Convert to US Eastern Time (UTC-5 or UTC-4 depending on DST)
    const usEasternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const endDate = usEasternTime.toISOString().split('T')[0]; // Today in YYYY-MM-DD format (US Eastern)
    
    // Use campaign start date if available, otherwise fall back to 30 days ago
    let startDate;
    if (campaignDetails.start_time) {
      // Convert campaign start time to US Eastern date format
      const campaignStartDate = new Date(campaignDetails.start_time);
      const campaignStartEastern = new Date(campaignStartDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
      startDate = campaignStartEastern.toISOString().split('T')[0];
    } else {
      // Fallback to 30 days ago if no start time available
      startDate = new Date(usEasternTime.getTime() - parseInt(daysBack) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    console.log(`📅 Fetching campaign data from campaign start to current date: ${startDate} to ${endDate} (US Eastern Time)`);
    console.log(`🌍 Your timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    console.log(`🇺🇸 US Eastern time: ${usEasternTime.toISOString()}`);
    console.log(`🕐 Your local time: ${now.toISOString()}`);

    // Fetch campaign insights with comprehensive fields
    console.log("Fetching campaign insights...");
    let insightsResponse;
    try {
      insightsResponse = await axios.get(
        `https://graph.facebook.com/v23.0/${campaignId}/insights?fields=account_currency,account_id,account_name,actions,action_values,ad_id,ad_name,adset_id,adset_name,attribution_setting,auction_bid,auction_competitiveness,buying_type,campaign_id,campaign_name,canvas_avg_view_percent,canvas_avg_view_time,clicks,cost_per_15_sec_video_view,cost_per_2_sec_continuous_video_view,cost_per_action_type,cost_per_ad_click,cost_per_conversion,cost_per_estimated_ad_recallers,cost_per_inline_link_click,cost_per_inline_post_engagement,cost_per_one_thousand_ad_impression,cost_per_outbound_click,cost_per_thruplay,cost_per_unique_action_type,cost_per_unique_click,cost_per_unique_conversion,cost_per_unique_inline_link_click,cost_per_unique_outbound_click,cpp,created_time,ctr,date_start,date_stop,estimated_ad_recall_rate,estimated_ad_recallers,frequency,full_view_impressions,full_view_reach,impressions,inline_link_click_ctr,inline_link_clicks,inline_post_engagement,instant_experience_clicks_to_open,instant_experience_clicks_to_start,instant_experience_outbound_clicks,interactive_component_tap,objective,optimization_goal,outbound_clicks,outbound_clicks_ctr,place_page_name,quality_ranking,reach,social_spend,spend,unique_actions,unique_clicks,unique_conversions,unique_ctr,unique_inline_link_click_ctr,unique_inline_link_clicks,unique_link_clicks_ctr,unique_outbound_clicks,unique_outbound_clicks_ctr,unique_video_continuous_2_sec_watched_actions,unique_video_view_15_sec,updated_time,video_15_sec_watched_actions,video_30_sec_watched_actions,video_avg_time_watched_actions,video_p100_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_play_actions,video_play_curve_actions,video_play_retention_0_to_15s_actions,video_play_retention_20_to_60s_actions,video_thruplay_watched_actions,video_time_watched_actions,website_ctr,website_purchase_roas&time_range={'since':'${startDate}','until':'${endDate}'}&access_token=${accessToken}`
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
        `https://graph.facebook.com/v23.0/${campaignId}/adsets?fields=account_id,adlabels,adset_schedule,asset_feed_id,attribution_spec,bid_amount,bid_constraints,bid_info,bid_strategy,billing_event,budget_remaining,campaign_id,configured_status,created_time,daily_budget,date_format,description,destination_type,effective_status,end_time,execution_options,frequency_control_specs,full_funnel_exploration_mode,id,instagram_actor_id,is_dynamic_creative,lifetime_budget,name,optimization_goal,optimization_sub_event,pacing_type,promoted_object,recommendations,recurring_budget_semantics,review_feedback,rf_prediction_id,source_adset,source_adset_id,start_time,status,targeting,time_based_ad_rotation_id_blocks,time_based_ad_rotation_intervals,updated_time,use_new_app_click&access_token=${accessToken}`
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
        `https://graph.facebook.com/v23.0/${campaignId}?fields=account_id,adlabels,adset_schedule,asset_feed_id,attribution_spec,bid_strategy,boosted_object_id,brand_lift_studies,budget_rebalance_flag,budget_remaining,buying_type,campaign_group_active_time,can_create_brand_lift_study,can_use_spend_cap,configured_status,created_time,daily_budget,effective_status,id,issues_info,last_budget_toggling_time,lifetime_budget,name,objective,optimization_goal,pacing_type,primary_attribution,promoted_object,recommendations,smart_promotion_type,source_campaign,special_ad_categories,spend_cap,start_time,status,stop_time,topline_id,updated_time&access_token=${accessToken}`
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
        `https://graph.facebook.com/v23.0/${campaignId}/ads?fields=account_id,ad_review_feedback,adlabels,adset_id,audience_id,bid_amount,campaign_id,configured_status,conversion_domain,created_time,creative,effective_status,id,name,objective,recommendations,source_ad,source_ad_id,status,tracking_specs,updated_time&access_token=${accessToken}`
      );
      adsData = adResponse.data.data;
      console.log("Ads data fetched successfully");

      // Extract the creative ID and fetch creative data
      if (adsData.length > 0 && adsData[0].creative && adsData[0].creative.id) {
        const creativeId = adsData[0].creative.id;
        console.log("Fetching creative data for ID:", creativeId);
        
        try {
  const creativeResponse = await axios.get(
            `https://graph.facebook.com/v23.0/${creativeId}?fields=account_id,actor_id,adlabels,applink_treatment,asset_feed_id,authorization_category,auto_update,body,branded_content_sponsor_page_id,bundle_folder_id,call_to_action_type,categorization_criteria,category_media_source,conversion_tracking_urls,created_time,description,effective_instagram_story_id,effective_object_story_id,id,image_crops,image_hash,image_url,instagram_actor_id,instagram_permalink_url,instagram_story_id,link,message,name,object_id,object_story_id,object_story_spec,object_type,object_url,place_page_set_id,platform_customizations,playable_asset_id,portrait_customizations,product_set_id,recommendations,source_instagram_media_id,status,thumbnail_url,title,url_tags,use_page_actor_override,video_id&access_token=${accessToken}`
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
    console.log("📅 Campaign actual start_time:", campaignDetails.start_time);
    console.log("📅 Campaign actual stop_time:", campaignDetails.stop_time);
    console.log("📅 Insights date range used:", `${startDate} to ${endDate}`);

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
        date_start: campaignDetails.start_time || campaignData.date_start,
        date_stop: campaignDetails.stop_time || campaignData.date_stop,
        
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
