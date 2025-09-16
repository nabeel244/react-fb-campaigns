import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import axios from "axios";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const accessToken = session.accessToken;

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
