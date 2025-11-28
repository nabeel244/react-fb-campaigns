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

  try {
    const session = USE_SANDBOX_MODE ? null : await getServerSession(authOptions);
    
    const accessToken = USE_SANDBOX_MODE 
      ? process.env.GOOGLE_SANDBOX_ACCESS_TOKEN
      : session?.accessToken;
    
    console.log(`🔧 Google Access Token: ${USE_SANDBOX_MODE ? 'Using sandbox token for testing' : 'Using session token'}`);

    // Get the user's Google Ads accounts (customer IDs)
    // First, we need to get the list of accessible customers
    const customersResponse = await axios.get(
      `https://googleads.googleapis.com/v16/customers:listAccessibleCustomers`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        }
      }
    );

    const customerIds = customersResponse.data.resourceNames || [];
    
    // For each customer, get account details
    const adAccounts = [];
    for (const customerResourceName of customerIds) {
      try {
        // Extract customer ID from resource name (format: customers/1234567890)
        const customerId = customerResourceName.split('/')[1];
        
        // Get customer details
        const customerDetailsResponse = await axios.post(
          `https://googleads.googleapis.com/v16/${customerResourceName}:searchStream`,
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
              'Authorization': `Bearer ${accessToken}`,
              'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
              'Content-Type': 'application/json',
            }
          }
        );

        const customerData = customerDetailsResponse.data.results?.[0]?.customer;
        if (customerData) {
          adAccounts.push({
            id: customerId,
            resourceName: customerResourceName,
            name: customerData.descriptiveName || `Account ${customerId}`,
            currencyCode: customerData.currencyCode,
            timeZone: customerData.timeZone,
            isManager: customerData.manager || false,
            isTestAccount: customerData.testAccount || false,
            accountStatus: customerData.testAccount ? 0 : 1, // 1 = active, 0 = test/inactive
          });
        }
      } catch (error) {
        console.error(`Error fetching customer ${customerResourceName}:`, error.response?.data || error.message);
        // Continue with other customers even if one fails
      }
    }

    return new Response(JSON.stringify({ data: adAccounts }), { status: 200 });
  } catch (error) {
    console.error("Error fetching Google Ads accounts:", error.response?.data || error.message);
    return new Response(JSON.stringify({ 
      error: error.response?.data?.error?.message || error.message 
    }), { status: 500 });
  }
}

