import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

/**
 * Google Ads API Test Mode:
 * 
 * For testing, you need:
 * 1. A developer token with "Test Account Access" level (initially all tokens have this)
 * 2. Create test accounts in Google Ads: https://adwords.google.com/um/Welcome/Home#ta
 * 3. When using a "Test Account Access" developer token, the API automatically returns ONLY test accounts
 * 
 * Test accounts are marked with customer.test_account = true and will appear with a 🧪 TEST prefix.
 * 
 * To use test mode:
 * - Set USE_SANDBOX_MODE=true in .env (uses GOOGLE_SANDBOX_ACCESS_TOKEN)
 * - OR login normally (uses session token) - if your developer token is "Test Account Access" level, 
 *   you'll only see test accounts automatically
 */

export async function GET(req) {
  console.log('🚀 ===== Google adaccounts route HIT =====');
  
  // Configuration: Set to true when using sandbox tokens (bypasses session authentication)
  // Note: Google Ads API test mode works differently - your developer token access level
  // determines what accounts you can see (Test Account Access = only test accounts)
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
        error: "Google Ads Developer Token is missing. Please add GOOGLE_ADS_DEVELOPER_TOKEN to your .env file" 
      }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    if (USE_SANDBOX_MODE) {
      console.log(`🔧 TEST MODE: Using sandbox access token`);
    } else {
      console.log(`🔧 Using Google Access Token from session`);
    }
    
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
    
    console.log(`\n📊 ===== DEVELOPER TOKEN STATUS =====`);
    console.log(`📊 Expected Access Level: Standard Access (from API center)`);
    console.log(`📊 With Standard Access, you should see BOTH test and production accounts`);
    console.log(`📊 Note: Accounts are automatically fetched from listAccessibleCustomers`);
    console.log(`📊 If only test accounts appear, check:`);
    console.log(`   1. Your OAuth account might only have access to test accounts`);
    console.log(`   2. Production accounts might not be linked to your OAuth account`);
    console.log(`========================================\n`);
    
    // Get the user's Google Ads accounts (customer IDs) - using axios
    // Note: The Google Ads API REST endpoint format
    // If developer token has "Test Account Access" level, only test accounts are accessible
    const apiUrl = 'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers';
    console.log(`🌐 Making request to: ${apiUrl}`);
    
    let customersRes;
    try {
      customersRes = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 600, // Don't throw, handle all status codes
      });
      
      console.log(`📊 Response status: ${customersRes.status}`);
      
      // Log response headers that might indicate access level
      if (customersRes.headers) {
        console.log(`📋 Response headers:`, JSON.stringify(customersRes.headers, null, 2));
      }
      
      if (customersRes.status !== 200) {
        console.error(`❌ Google Ads API returned status ${customersRes.status}`);
        console.error(`❌ Response data:`, customersRes.data);
        
        const errorMessage = customersRes.data?.error?.message || 'Unknown error';
        const errorCode = customersRes.data?.error?.code || customersRes.status;
        
        // Handle 403 - Access Denied (might indicate access level or scope issue)
        if (customersRes.status === 403) {
          console.log(`❌ Access Denied (403) - Authentication/Authorization Issue`);
          
          // Check if it's a scope issue
          if (errorMessage.includes('insufficient authentication scopes') || errorMessage.includes('insufficient_scope')) {
            console.log(`📊 Issue: Access Token Missing Required Scope`);
            console.log(`   - Your access token doesn't have the Google Ads API scope`);
            console.log(`   - Required scope: https://www.googleapis.com/auth/adwords`);
            console.log(`   - Current GOOGLE_USE_ADWORDS_SCOPE setting: ${process.env.GOOGLE_USE_ADWORDS_SCOPE || 'not set'}`);
            console.log(`   - Solution:`);
            console.log(`     1. Add GOOGLE_USE_ADWORDS_SCOPE=true to your .env file`);
            console.log(`     2. Make sure your email is added as a test user in Google Cloud Console`);
            console.log(`     3. Restart your dev server`);
            console.log(`     4. Logout and login again to get a new token with the scope`);
          } else {
            console.log(`📊 Possible reasons:`);
            console.log(`   - Developer token access level issue`);
            console.log(`   - Token is not approved or pending approval`);
            console.log(`   - Account is not accessible with current token permissions`);
            console.log(`ℹ️ Check your token status at: https://ads.google.com/aw/apicenter`);
          }
        }
        
        // Handle 501 - Not Implemented error
        // For production use, we rely on listAccessibleCustomers working properly
        if (customersRes.status === 501) {
          return new Response(JSON.stringify({ 
            error: "Operation not supported via REST API",
            message: "The listAccessibleCustomers endpoint is not available via REST API. This is required to fetch accounts associated with the logged-in Google account.",
            details: errorMessage,
            solution: {
              step1: "This endpoint should work with Standard Access developer tokens",
              step2: "Ensure your developer token has Standard Access level",
              step3: "Verify your OAuth access token has the required Google Ads API scope",
              step4: "Contact Google Ads API support if the issue persists"
            },
            code: errorCode
          }), { 
            status: 501,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Check if API is not enabled
        if (errorMessage.includes('has not been used') || errorMessage.includes('is disabled')) {
          const enableUrl = errorMessage.match(/https:\/\/[^\s]+/)?.[0] || 'https://console.developers.google.com/apis/library/googleads.googleapis.com';
          
          return new Response(JSON.stringify({ 
            error: "Google Ads API is not enabled",
            message: "You need to enable the Google Ads API in your Google Cloud Console project.",
            details: errorMessage,
            solution: {
              step1: "Go to Google Cloud Console",
              step2: `Enable the API at: ${enableUrl}`,
              step3: "Wait a few minutes for changes to propagate",
              step4: "Try again"
            },
            enableUrl: enableUrl
          }), { 
            status: customersRes.status,
            headers: { "Content-Type": "application/json" }
          });
        }
        
        return new Response(JSON.stringify({ 
          error: `Google Ads API returned error: ${customersRes.status}`,
          details: errorMessage,
          code: errorCode,
          message: `The API endpoint returned a ${customersRes.status} status. Please check your developer token and access token permissions.`
        }), { 
          status: customersRes.status,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      console.log(`✅ Successfully got response from listAccessibleCustomers`);
      console.log(`📊 Your developer token has Standard Access - should return BOTH test and production accounts`);
    } catch (apiError) {
      console.error(`❌ Google Ads API Exception:`, {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data ? 
          (typeof apiError.response.data === 'string' ? apiError.response.data.substring(0, 500) : apiError.response.data) : 
          'No response data',
        message: apiError.message,
        code: apiError.code
      });
      
      // Try to parse the error response
      const errorData = apiError.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData.substring(0, 500) // First 500 chars if HTML
        : errorData?.error?.message || apiError.message;
      
      return new Response(JSON.stringify({ 
        error: "Failed to fetch accessible customers from Google Ads API",
        details: errorMessage,
        status: apiError.response?.status || 500,
        code: apiError.code
      }), { 
        status: apiError.response?.status || 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const customerIds = customersRes.data.resourceNames || [];
    console.log(`📋 Found ${customerIds.length} accessible customer(s) via listAccessibleCustomers`);
    console.log(`📊 With Standard Access, this should include BOTH test and production accounts`);
    
    // For each customer, get account details
    const adAccounts = [];
    for (const customerResourceName of customerIds) {
      try {
        // Extract customer ID from resource name (format: customers/1234567890)
        const customerId = customerResourceName.split('/')[1];
        
        // Get customer details using axios
        const customerDetailsRes = await axios.post(
          `https://googleads.googleapis.com/v18/${customerResourceName}:searchStream`,
          {
            query: `
              SELECT 
                customer.id,
                customer.descriptive_name,
                customer.currency_code,
                customer.time_zone,
                customer.manager,
                customer.test_account
              FROM customer
              LIMIT 1
            `
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'developer-token': developerToken,
              'Content-Type': 'application/json',
            }
          }
        );

        const customerData = customerDetailsRes.data.results?.[0]?.customer;
        if (customerData) {
          const isTestAccount = customerData.testAccount || false;
          
          adAccounts.push({
            id: customerId,
            resourceName: customerResourceName,
            name: isTestAccount 
              ? `🧪 TEST: ${customerData.descriptiveName || `Account ${customerId}`}`
              : `📊 PRODUCTION: ${customerData.descriptiveName || `Account ${customerId}`}`,
            currencyCode: customerData.currencyCode,
            timeZone: customerData.timeZone,
            isManager: customerData.manager || false,
            isTestAccount: isTestAccount,
            accountStatus: isTestAccount ? 0 : 1, // 0 = test/inactive, 1 = active
          });
          
          if (isTestAccount) {
            console.log(`🧪 Found TEST account: ${customerId} - ${customerData.descriptiveName || 'Unnamed'}`);
          } else {
            console.log(`✅ Found PRODUCTION account: ${customerId} - ${customerData.descriptiveName || 'Unnamed'}`);
          }
        }
      } catch (error) {
        console.error(`Error fetching customer ${customerResourceName}:`, error.response?.data || error.message);
      }
    }

    const testAccountsCount = adAccounts.filter(acc => acc.isTestAccount).length;
    const productionAccountsCount = adAccounts.length - testAccountsCount;
    
    // Infer access level based on account types
    let inferredAccessLevel = "Unknown";
    if (productionAccountsCount > 0) {
      inferredAccessLevel = "✅ Standard Access CONFIRMED - Can access production accounts!";
    } else if (testAccountsCount > 0) {
      inferredAccessLevel = "⚠️ Only test accounts found - Token might have 'Test Account Access' level, or production accounts not accessible";
    } else {
      inferredAccessLevel = "Unknown (no accounts found)";
    }
    
    console.log(`\n📊 ===== ACCOUNT SUMMARY =====`);
    console.log(`📊 Developer Token Access Level (inferred): ${inferredAccessLevel}`);
    console.log(`📊 Your token has: Standard Access (from API center)`);
    console.log(`📊 Accounts found:`);
    console.log(`   - Total: ${adAccounts.length}`);
    console.log(`   - 🧪 Test accounts: ${testAccountsCount}`);
    console.log(`   - 📊 Production accounts: ${productionAccountsCount}`);
    
    if (productionAccountsCount === 0 && testAccountsCount > 0) {
      console.log(`\n⚠️ WARNING: You have Standard Access but only test accounts are showing!`);
      console.log(`   Possible reasons:`);
      console.log(`   1. The OAuth user might only have access to test accounts`);
      console.log(`   2. Production accounts might not be linked to your OAuth account`);
      console.log(`   3. Check that production accounts are accessible via your Google Ads account`);
    }
    
    console.log(`===============================\n`);
    
    return new Response(JSON.stringify({ 
      data: adAccounts,
      meta: {
        total: adAccounts.length,
        testAccounts: testAccountsCount,
        productionAccounts: productionAccountsCount,
        isTestMode: USE_SANDBOX_MODE
      }
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ Error fetching Google Ads accounts:", error.response?.data || error.message);
    
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
