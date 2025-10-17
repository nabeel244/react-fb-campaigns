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

  try {
    const session = USE_SANDBOX_MODE ? null : await getServerSession(authOptions);
    
    const accessToken = USE_SANDBOX_MODE 
      ? process.env.SANDBOX_ACCESS_TOKEN
      : session?.accessToken;
    
    console.log(`🔧 Access Token: ${USE_SANDBOX_MODE ? 'Using sandbox token for testing' : 'Using session token'}`);

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
