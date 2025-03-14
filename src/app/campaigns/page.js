"use client";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetch("/api/facebook/campaigns")
        .then((res) => res.json())
        .then((data) => {
          setCampaigns(data?.data || []);
          setLoading(false);
        })
        .catch((err) => console.error("Error fetching campaigns:", err));
    }
  }, [session]);

  return (
    <div className="p-6">
      {session ? (
        <>
          <h1 className="text-2xl font-bold mb-4">Facebook Campaigns</h1>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg mb-4"
          >
            Logout
          </button>
          {loading ? (
            <p>Loading campaigns...</p>
          ) : (
            <ul className="list-disc pl-6">
              {campaigns.map((campaign) => (
                <li key={campaign.id} className="mb-2">
                  <strong>{campaign.name}</strong> - {campaign.status}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p>Please <a href="/login" className="text-blue-500">login</a> to view campaigns.</p>
      )}
    </div>
  );
}
