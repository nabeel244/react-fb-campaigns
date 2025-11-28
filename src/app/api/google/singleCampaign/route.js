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
  const campaignId = urlParams.get("campaignId");
  const daysBack = urlParams.get("days") || "30";

  if (!customerId || !campaignId) {
    return new Response(JSON.stringify({ error: "Customer ID or Campaign ID is missing" }), { status: 400 });
  }

  try {
    const session = USE_SANDBOX_MODE ? null : await getServerSession(authOptions);
    
    const accessToken = USE_SANDBOX_MODE 
      ? process.env.GOOGLE_SANDBOX_ACCESS_TOKEN
      : session?.accessToken;
    
    console.log(`🔧 Google Access Token: ${USE_SANDBOX_MODE ? 'Using sandbox token for testing' : 'Using session token'}`);

    const customerResourceName = `customers/${customerId}`;

    // Calculate date range
    const endDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - parseInt(daysBack));
    const startDate = startDateObj.toISOString().split('T')[0].replace(/-/g, '');

    // Fetch campaign details with comprehensive metrics
    const campaignResponse = await axios.post(
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
            campaign_budget.period,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_micros,
            metrics.conversions,
            metrics.cost_per_conversion,
            metrics.conversion_value,
            metrics.cost_per_conversion_value,
            metrics.search_impression_share,
            metrics.search_rank_lost_impression_share,
            metrics.search_exact_match_impression_share,
            metrics.video_views,
            metrics.video_view_rate,
            metrics.interactions,
            metrics.interaction_rate,
            segments.date
          FROM campaign
          WHERE campaign.id = ${campaignId}
          AND segments.date >= '${startDate}'
          AND segments.date <= '${endDate}'
          ORDER BY segments.date DESC
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

    const results = campaignResponse.data.results || [];
    
    if (results.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No campaign data found for the specified time range" 
      }), { status: 404 });
    }

    // Aggregate metrics across all days
    const aggregated = {
      impressions: 0,
      clicks: 0,
      costMicros: 0,
      conversions: 0,
      conversionValue: 0,
      videoViews: 0,
      interactions: 0,
    };

    results.forEach(result => {
      aggregated.impressions += result.metrics?.impressions || 0;
      aggregated.clicks += result.metrics?.clicks || 0;
      aggregated.costMicros += result.metrics?.costMicros || 0;
      aggregated.conversions += result.metrics?.conversions || 0;
      aggregated.conversionValue += result.metrics?.conversionValue || 0;
      aggregated.videoViews += result.metrics?.videoViews || 0;
      aggregated.interactions += result.metrics?.interactions || 0;
    });

    const firstResult = results[0];
    const campaign = firstResult.campaign;
    const metrics = firstResult.metrics;
    const budget = firstResult.campaignBudget;

    // Calculate derived metrics
    const ctr = aggregated.clicks > 0 ? (aggregated.clicks / aggregated.impressions) * 100 : 0;
    const avgCpc = aggregated.clicks > 0 ? aggregated.costMicros / aggregated.clicks / 1000000 : 0;
    const cost = aggregated.costMicros / 1000000;
    const costPerConversion = aggregated.conversions > 0 ? cost / aggregated.conversions : 0;
    const roas = aggregated.conversionValue > 0 ? aggregated.conversionValue / cost : 0;

    // Get daily insights
    const dailyInsights = results.map(result => ({
      date: result.segments.date,
      impressions: result.metrics?.impressions || 0,
      clicks: result.metrics?.clicks || 0,
      cost: result.metrics?.costMicros ? (result.metrics.costMicros / 1000000) : 0,
      ctr: result.metrics?.ctr ? (result.metrics.ctr * 100) : 0,
      avgCpc: result.metrics?.averageCpc ? (result.metrics.averageCpc / 1000000) : 0,
      conversions: result.metrics?.conversions || 0,
    })).reverse(); // Reverse to show oldest first

    // Get ad groups for this campaign
    let adGroups = [];
    try {
      const adGroupsResponse = await axios.post(
        `https://googleads.googleapis.com/v16/${customerResourceName}:searchStream`,
        {
          query: `
            SELECT 
              ad_group.id,
              ad_group.name,
              ad_group.status,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.ctr,
              metrics.average_cpc
            FROM ad_group
            WHERE ad_group.campaign = 'customers/${customerId}/campaigns/${campaignId}'
            ORDER BY metrics.impressions DESC
            LIMIT 50
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

      adGroups = adGroupsResponse.data.results?.map(result => ({
        id: result.adGroup.id.toString(),
        name: result.adGroup.name,
        status: result.adGroup.status,
        impressions: result.metrics?.impressions || 0,
        clicks: result.metrics?.clicks || 0,
        cost: result.metrics?.costMicros ? (result.metrics.costMicros / 1000000) : 0,
        ctr: result.metrics?.ctr ? (result.metrics.ctr * 100) : 0,
        avgCpc: result.metrics?.averageCpc ? (result.metrics.averageCpc / 1000000) : 0,
      })) || [];
    } catch (error) {
      console.error("Error fetching ad groups:", error.response?.data || error.message);
    }

    return new Response(
      JSON.stringify({
        // Basic Campaign Info
        campaign_name: campaign.name,
        objective: campaign.advertisingChannelType,
        date_start: campaign.startDate,
        date_stop: campaign.endDate,
        status: campaign.status,
        bidding_strategy: campaign.biddingStrategyType,
        
        // Core Metrics
        clicks: aggregated.clicks,
        impressions: aggregated.impressions,
        spend: cost,
        cpc: avgCpc,
        cpm: aggregated.impressions > 0 ? (cost / aggregated.impressions) * 1000 : 0,
        ctr: ctr,
        reach: aggregated.impressions, // Google Ads doesn't have reach, using impressions
        frequency: aggregated.impressions > 0 ? (aggregated.impressions / aggregated.clicks) : 0,
        
        // Conversion Metrics
        conversions: aggregated.conversions,
        conversion_value: aggregated.conversionValue,
        cost_per_conversion: costPerConversion,
        roas: roas,
        
        // Budget
        daily_budget: budget?.amountMicros ? (budget.amountMicros / 1000000) : 0,
        budget_period: budget?.period || 'DAILY',
        
        // Performance Metrics
        search_impression_share: metrics?.searchImpressionShare ? (metrics.searchImpressionShare * 100) : 0,
        search_rank_lost_impression_share: metrics?.searchRankLostImpressionShare ? (metrics.searchRankLostImpressionShare * 100) : 0,
        video_views: aggregated.videoViews,
        video_view_rate: aggregated.impressions > 0 ? (aggregated.videoViews / aggregated.impressions) * 100 : 0,
        interactions: aggregated.interactions,
        interaction_rate: aggregated.impressions > 0 ? (aggregated.interactions / aggregated.impressions) * 100 : 0,
        
        // Breakdown Data
        ad_groups: adGroups,
        daily_insights: dailyInsights,
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching Google Ads campaign insights:", error.response?.data || error.message);
    return new Response(JSON.stringify({ 
      error: error.response?.data?.error?.message || error.message 
    }), { status: 500 });
  }
}

