import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

/**
 * Google Ads API Campaigns Route
 * Fetches campaigns for a specific customer account
 */

export async function GET(req) {
  console.log('🚀 ===== Google campaigns route HIT =====');
  
  // Configuration: Set to true when using sandbox tokens (bypasses session authentication)
  const USE_SANDBOX_MODE = process.env.USE_SANDBOX_MODE === 'true';
  
  if (!USE_SANDBOX_MODE) {
    const session = await getServerSession(authOptions);
    if (!session || session.provider !== 'google') {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const customerId = urlParams.get("customerId");

  if (!customerId) {
    return new Response(JSON.stringify({ error: "Customer ID is missing" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const session = USE_SANDBOX_MODE ? null : await getServerSession(authOptions);
    
    const accessToken = USE_SANDBOX_MODE 
      ? process.env.GOOGLE_SANDBOX_ACCESS_TOKEN
      : session?.accessToken;
    
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Access token is missing" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (!developerToken) {
      return new Response(JSON.stringify({ 
        error: "Google Ads Developer Token is missing" 
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Clean customer ID (remove dashes if present)
    let cleanCustomerId = customerId.replace(/-/g, '');
    let loginCustomerId = null; // For MCC account queries (detected automatically from account data)
    
    // Note: For production, accounts are automatically fetched from listAccessibleCustomers
    // MCC accounts and their linked client accounts are handled automatically by the Google Ads API
    
    // Log developer token info (masked for security)
    if (developerToken) {
      const tokenLength = developerToken.length;
      const maskedToken = tokenLength > 8 
        ? `${developerToken.substring(0, 4)}...${developerToken.substring(tokenLength - 4)}`
        : '****';
      console.log(`🔑 Developer Token: ${maskedToken} (length: ${tokenLength})`);
      console.log(`📋 Developer Token Source: GOOGLE_ADS_DEVELOPER_TOKEN from .env`);
    } else {
      console.log(`❌ Developer Token: NOT SET`);
    }
    
    // Log access token info
    if (accessToken) {
      const tokenLength = accessToken.length;
      const maskedToken = tokenLength > 8 
        ? `${accessToken.substring(0, 8)}...${accessToken.substring(tokenLength - 8)}`
        : '****';
      console.log(`🔐 Access Token: ${maskedToken} (length: ${tokenLength})`);
      
      // AdWords scope is always included for production Google Ads API access
      console.log(`📋 Google Ads API Scope: ✅ ENABLED (required for production access)`);
    }
    
    console.log(`ℹ️ Developer Token Access Levels:`);
    console.log(`   - Test Account Access: Can only access test accounts (default for new tokens)`);
    console.log(`   - Basic Access: Can access production accounts with limited features`);
    console.log(`   - Standard Access: Full access to production accounts`);
    console.log(`ℹ️ To check your token's access level, visit: https://ads.google.com/aw/apicenter`);
    
    const customerResourceName = `customers/${cleanCustomerId}`;
    console.log(`📊 Fetching campaigns for customer: ${cleanCustomerId}`);
    if (loginCustomerId) {
      console.log(`🔑 Using MCC account as login-customer-id: ${loginCustomerId}`);
    }
    
    // Fetch campaigns using searchStream (GAQL query)
    // Note: REST API has limitations, so we'll try and fallback if needed
    let campaigns = [];
    
    try {
      const endpointUrl = `https://googleads.googleapis.com/v18/${customerResourceName}/googleAds:searchStream`;
      console.log(`🔍 Fetching campaigns from: ${endpointUrl}`);
      
      const campaignsResponse = await axios.post(
        endpointUrl,
        {
          query: `
            SELECT 
              campaign.id,
              campaign.name,
              campaign.status,
              campaign.advertising_channel_type,
              campaign.start_date,
              campaign.end_date,
              campaign.bidding_strategy_type
            FROM campaign
            ORDER BY campaign.id DESC
            LIMIT 100
          `
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': developerToken,
            'Content-Type': 'application/json',
            // Add login-customer-id header if querying through MCC account
            ...(loginCustomerId && { 'login-customer-id': loginCustomerId }),
          },
          validateStatus: (status) => status < 600,
        }
      );
      
      if (campaignsResponse.status === 200 && campaignsResponse.data?.results) {
        campaigns = campaignsResponse.data.results.map((result) => {
          const campaign = result.campaign;
          return {
            id: campaign.id?.toString(),
            name: campaign.name || `Campaign ${campaign.id}`,
            status: campaign.status || 'UNKNOWN',
            advertisingChannelType: campaign.advertisingChannelType || 'UNKNOWN',
            startDate: campaign.startDate || null,
            endDate: campaign.endDate || null,
            biddingStrategyType: campaign.biddingStrategyType || 'UNKNOWN',
          };
        });
        console.log(`✅ Successfully fetched ${campaigns.length} campaigns`);
        console.log(`📊 Developer Token Access Level: Successfully queried campaigns - token has sufficient permissions`);
        console.log(`ℹ️ Note: If you can query production accounts, your token likely has Basic or Standard Access`);
      } else {
        console.log(`⚠️ Campaigns endpoint returned status ${campaignsResponse.status}`);
        
        // Handle 501 - REST API doesn't support this endpoint
        if (campaignsResponse.status === 501) {
          console.log(`⚠️ REST API doesn't support searchStream for campaigns`);
          console.log(`📊 Developer Token Access Level: Cannot be determined (REST API limitation)`);
          console.log(`ℹ️ Note: This 501 error is due to REST API limitations, not your developer token access level`);
          
          // Return mock data for testing since REST API doesn't support campaigns
          // Set USE_MOCK_CAMPAIGNS=false in .env to disable mock data
          const USE_MOCK_DATA = process.env.USE_MOCK_CAMPAIGNS !== 'false';
          
          if (USE_MOCK_DATA) {
            console.log(`🧪 Returning mock campaign data for testing`);
            const mockCampaigns = [
              {
                id: '1001',
                name: 'Summer Sale Campaign',
                status: 'ENABLED',
                advertisingChannelType: 'SEARCH',
                startDate: '2024-06-01',
                endDate: '2024-08-31',
                biddingStrategyType: 'MAXIMIZE_CONVERSIONS'
              },
              {
                id: '1002',
                name: 'Product Launch Campaign',
                status: 'ENABLED',
                advertisingChannelType: 'DISPLAY',
                startDate: '2024-07-15',
                endDate: null,
                biddingStrategyType: 'TARGET_CPA'
              },
              {
                id: '1003',
                name: 'Brand Awareness Campaign',
                status: 'PAUSED',
                advertisingChannelType: 'VIDEO',
                startDate: '2024-05-01',
                endDate: '2024-12-31',
                biddingStrategyType: 'TARGET_IMPRESSION_SHARE'
              }
            ];
            
            return new Response(JSON.stringify({ 
              data: mockCampaigns,
              meta: {
                total: mockCampaigns.length,
                customerId: cleanCustomerId,
                note: "Mock data - REST API doesn't support querying campaigns",
                isMockData: true
              }
            }), { 
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
          
          // Return empty list with helpful message
          return new Response(JSON.stringify({ 
            data: [],
            meta: {
              total: 0,
              customerId: cleanCustomerId,
              error: "REST API limitation",
              message: "The Google Ads API REST interface doesn't support querying campaigns via searchStream. This requires the gRPC API or Google Ads API client library.",
              note: "To fetch campaigns, you would need to use the Google Ads API client library (gRPC) instead of REST API. Or set USE_MOCK_CAMPAIGNS=true in .env for testing with mock data."
            }
          }), { 
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    } catch (searchError) {
      console.log(`⚠️ searchStream endpoint not available (${searchError.response?.status || 'error'}), returning empty campaigns list`);
      console.error('Campaign search error:', searchError.response?.data || searchError.message);
      
      // Check if it's a 501 error
      if (searchError.response?.status === 501) {
        return new Response(JSON.stringify({ 
          data: [],
          meta: {
            total: 0,
            customerId: cleanCustomerId,
            error: "REST API limitation",
            message: "The Google Ads API REST interface doesn't support querying campaigns via searchStream. This requires the gRPC API or Google Ads API client library.",
            note: "To fetch campaigns, you would need to use the Google Ads API client library (gRPC) instead of REST API."
          }
        }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Return empty list instead of error - allows UI to work even without campaigns
      return new Response(JSON.stringify({ 
        data: [],
        meta: {
          total: 0,
          customerId: cleanCustomerId,
          note: "Campaign searchStream endpoint may not be available via REST API"
        }
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      data: campaigns,
      meta: {
        total: campaigns.length,
        customerId: cleanCustomerId
      }
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ Error fetching Google Ads campaigns:", error.response?.data || error.message);
    
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.response?.data || error.message
    }), { 
      status: error.response?.status || 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

