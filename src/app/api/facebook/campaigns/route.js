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

  if (!adAccountId) {
    return new Response(JSON.stringify({ error: "Ad account ID is missing" }), { status: 400 });
  }

  try {
    const accessToken = session.accessToken;

    // Fetch campaigns from the ad account
    const campaignsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,objective&access_token=${accessToken}`
    );

    return new Response(JSON.stringify(campaignsResponse.data), { status: 200 });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
