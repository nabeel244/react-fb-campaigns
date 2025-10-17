import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req) {
  // Configuration: Set to true when using sandbox tokens (bypasses session authentication)
  const USE_SANDBOX_MODE = false;
  
  if (!USE_SANDBOX_MODE) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  }

  try {
    // Configuration: Set to true to use sandbox token, false to use session token
    const USE_SANDBOX_TOKEN = false;
    
    const session = USE_SANDBOX_MODE ? null : await getServerSession(authOptions);
    
    const accessToken = USE_SANDBOX_TOKEN 
      ? "EAAp5zmXNYfEBPo3yPjnZBvtqhgfLJkAopPpIiqNgsUF6OJcGFQV3TnrzEhz2Cngm4mzN4Mlvm1WIGxuU9arQGD6rQwzbQjSC2ffN31G1e5xWYzPr7hZAxMaP0g22DCFRmlPNejZBDUk3AiU1kpfSQPdoxnnswA8uMACZB3tysatJlEWBCd79Mwa2yhszTq9Rn5R0"
      : session?.accessToken;
    
    console.log(`🔧 Access Token: ${USE_SANDBOX_TOKEN ? 'Using sandbox token for testing' : 'Using session token'}`);

    // Get the user's Ad Accounts
    const adAccountsResponse = await axios.get(
      `https://graph.facebook.com/v23.0/me/adaccounts?fields=id,name,account_status&access_token=${accessToken}`
    );

    return new Response(JSON.stringify(adAccountsResponse.data), { status: 200 });
  } catch (error) {
    console.error("Error fetching ad accounts:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
