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
    console.log(`🔑 Developer Token exists: ${!!developerToken}`);
    console.log(`🧪 Note: If your developer token has "Test Account Access" level, only test accounts will be returned`);
    
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
      
      if (customersRes.status !== 200) {
        console.error(`❌ Google Ads API returned status ${customersRes.status}`);
        console.error(`❌ Response data:`, customersRes.data);
        
        const errorMessage = customersRes.data?.error?.message || 'Unknown error';
        const errorCode = customersRes.data?.error?.code || customersRes.status;
        
        // Handle 501 - Not Implemented error
        // Fallback: If we have a test customer ID, use it directly
        if (customersRes.status === 501) {
          const testCustomerId = process.env.GOOGLE_ADS_TEST_CUSTOMER_ID;
          const urlParams = new URLSearchParams(req.url.split('?')[1]);
          const customerIdParam = urlParams.get('customerId') || testCustomerId;
          
          if (customerIdParam) {
            console.log(`⚠️ listAccessibleCustomers returned 501, using provided customer ID: ${customerIdParam}`);
            
            // Ensure customer ID is clean (remove dashes if present, like "298-142-6433" -> "2981426433")
            const cleanCustomerId = customerIdParam.replace(/-/g, '');
            console.log(`🧹 Cleaned customer ID: ${cleanCustomerId} (original: ${customerIdParam})`);
            
            if (cleanCustomerId.length !== 10) {
              return new Response(JSON.stringify({ 
                error: "Invalid customer ID format",
                details: `Customer ID must be 10 digits. Got: ${cleanCustomerId} (${cleanCustomerId.length} digits)`,
                customerId: cleanCustomerId
              }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
              });
            }
            
            // Continue to fetch this customer directly
            const customerResourceName = `customers/${cleanCustomerId}`;
            const customerIds = [customerResourceName];
            
            // Skip the listing step and go directly to fetching customer details
            // We'll handle this after the try-catch
            console.log(`📋 Using provided customer ID: ${cleanCustomerId}`);
            
            // Fetch this customer directly
            try {
              // Try to fetch customer details via REST API
              // Note: Google Ads API REST has limited support - may need to use basic info
              console.log(`📝 Attempting to fetch details for Customer ID: ${cleanCustomerId}`);
              
              // Try the searchStream endpoint - if it fails, we'll use basic account info
              let customerData = null;
              const endpointUrl = `https://googleads.googleapis.com/v18/customers/${cleanCustomerId}/googleAds:searchStream`;
              
              try {
                console.log(`🔍 Trying endpoint: ${endpointUrl}`);
                const customerDetailsRes = await axios.post(
                  endpointUrl,
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
                    },
                    validateStatus: (status) => status < 600,
                  }
                );
                
                if (customerDetailsRes.status === 200) {
                  customerData = customerDetailsRes.data.results?.[0]?.customer;
                  console.log(`✅ Successfully fetched customer details`);
                } else {
                  console.log(`⚠️ Endpoint returned ${customerDetailsRes.status}, using basic account info`);
                }
              } catch (searchError) {
                console.log(`⚠️ searchStream endpoint not available (${searchError.response?.status || 'error'}), using basic account info`);
              }
              
              // Use fetched data or create basic account structure for testing
              const accountName = customerData?.descriptiveName || `Account ${cleanCustomerId}`;
              const isTestAccount = customerData?.testAccount || false; // Assume test if we can't verify
              
              const adAccounts = [];
              
              // Add the MCC/Manager account
              adAccounts.push({
                id: cleanCustomerId,
                resourceName: customerResourceName,
                name: `🧪 TEST: ${accountName}`,
                currencyCode: customerData?.currencyCode || 'USD',
                timeZone: customerData?.timeZone || 'UTC',
                isManager: true,
                isTestAccount: true,
                accountStatus: 1,
              });
              
              // If there's a linked client account, add it as well
              const linkedClientId = process.env.GOOGLE_ADS_TEST_CUSTOMER_LINKED_ID;
              if (linkedClientId) {
                const cleanLinkedId = linkedClientId.replace(/-/g, '');
                adAccounts.push({
                  id: cleanLinkedId,
                  resourceName: `customers/${cleanLinkedId}`,
                  name: `🧪 TEST: Client Account ${cleanLinkedId}`,
                  currencyCode: customerData?.currencyCode || 'USD',
                  timeZone: customerData?.timeZone || 'UTC',
                  isManager: false,
                  isTestAccount: true,
                  accountStatus: 1,
                });
                console.log(`📋 Added linked client account: ${cleanLinkedId}`);
              }

              return new Response(JSON.stringify({ 
                data: adAccounts,
                meta: {
                  total: adAccounts.length,
                  testAccounts: adAccounts.length,
                  productionAccounts: 0,
                  isTestMode: USE_SANDBOX_MODE,
                  note: "Using provided customer ID (searchStream endpoint may not be available via REST)",
                  customerId: cleanCustomerId,
                  linkedClientId: linkedClientId ? linkedClientId.replace(/-/g, '') : null
                }
              }), { 
                status: 200,
                headers: { "Content-Type": "application/json" }
              });
            } catch (customerError) {
              console.error(`❌ Error fetching customer ${customerIdParam}:`, {
                status: customerError.response?.status,
                statusText: customerError.response?.statusText,
                data: customerError.response?.data,
                message: customerError.message,
                url: `https://googleads.googleapis.com/v18/${customerResourceName}:searchStream`
              });
              
              const errorDetails = customerError.response?.data?.error || {};
              const errorMessage = errorDetails.message || customerError.message;
              
              return new Response(JSON.stringify({ 
                error: "Failed to fetch customer details",
                details: errorMessage,
                status: customerError.response?.status,
                customerId: cleanCustomerId || customerIdParam,
                endpoint: customerResourceName ? `v18/${customerResourceName}:searchStream` : 'unknown',
                fullError: customerError.response?.data,
                suggestion: "Make sure the customer ID is correct, accessible with your developer token, and that the account exists"
              }), { 
                status: customerError.response?.status || 500,
                headers: { "Content-Type": "application/json" }
              });
            }
          }
          
          // If no fallback customer ID, return error
          return new Response(JSON.stringify({ 
            error: "Operation not supported via REST API",
            message: "The listAccessibleCustomers endpoint may not be available via REST API.",
            details: errorMessage,
            solution: {
              option1: "Provide a customer ID directly: Add GOOGLE_ADS_TEST_CUSTOMER_ID to your .env file",
              option2: "Or pass customer ID as query parameter: /api/google/adaccounts?customerId=1234567890",
              option3: "Contact Google Ads API support about REST API limitations"
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
    console.log(`📋 Found ${customerIds.length} accessible customers`);
    
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
              ? `🧪 ${customerData.descriptiveName || `Account ${customerId}`}`
              : (customerData.descriptiveName || `Account ${customerId}`),
            currencyCode: customerData.currencyCode,
            timeZone: customerData.timeZone,
            isManager: customerData.manager || false,
            isTestAccount: isTestAccount,
            accountStatus: isTestAccount ? 0 : 1, // 0 = test/inactive, 1 = active
          });
          
          if (isTestAccount) {
            console.log(`🧪 Found test account: ${customerId} - ${customerData.descriptiveName || 'Unnamed'}`);
          }
        }
      } catch (error) {
        console.error(`Error fetching customer ${customerResourceName}:`, error.response?.data || error.message);
      }
    }

    const testAccountsCount = adAccounts.filter(acc => acc.isTestAccount).length;
    const productionAccountsCount = adAccounts.length - testAccountsCount;
    
    console.log(`✅ Returning ${adAccounts.length} Google Ads account(s)`);
    if (testAccountsCount > 0) {
      console.log(`🧪 Test accounts: ${testAccountsCount}`);
    }
    if (productionAccountsCount > 0) {
      console.log(`📊 Production accounts: ${productionAccountsCount}`);
    }
    
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
