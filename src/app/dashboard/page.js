"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NewChatComponent from "@/components/NewChatComponent";

// ===== CONFIGURATION =====
const USE_SANDBOX_MODE = process.env.NEXT_PUBLIC_USE_SANDBOX_MODE === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// =========================

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [adAccounts, setAdAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState({ adAccounts: true, campaigns: false });
  const [error, setError] = useState("");
  
  // Chat state management
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [campaignData, setCampaignData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);

  // Fetch ad accounts when authenticated
  useEffect(() => {
    if (USE_SANDBOX_MODE) {
      console.log("🔧 Sandbox mode - fetching ad accounts directly");
      fetchAdAccounts();
    } else if (status === "unauthenticated") {
      router.push("/login");
      return;
    } else if (status === "authenticated") {
      // Redirect Google users to Google Ads page
      if (session?.provider === 'google') {
        router.push("/google");
        return;
      }
      // For Facebook users, fetch accounts
      fetchAdAccounts();
    }
  }, [status, router, session]);

  const fetchAdAccounts = async () => {
    try {
      setLoading(prev => ({ ...prev, adAccounts: true }));
      setError("");
      
      const response = await fetch("/api/facebook/adaccounts");
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setAdAccounts(data?.data || []);
      }
    } catch (err) {
      setError("Error fetching ad accounts");
      console.error("Error fetching ad accounts:", err);
    } finally {
      setLoading(prev => ({ ...prev, adAccounts: false }));
    }
  };

  const handleAccountClick = async (adAccountId) => {
    try {
      setSelectedAccount(adAccountId);
      setLoading(prev => ({ ...prev, campaigns: true }));
      setError("");
      
      const response = await fetch(`/api/facebook/campaigns?adAccountId=${adAccountId}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        // Facebook API returns { data: [...] } format
        setCampaigns(data?.data || []);
      }
    } catch (err) {
      setError("Error fetching campaigns");
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  // Helper function to get stored auth data
  const getStoredAuthData = () => {
    try {
      const authData = localStorage.getItem('userAuth');
      if (authData) {
        return JSON.parse(authData);
      }
    } catch (error) {
      console.error("Error retrieving stored auth data:", error);
    }
    return null;
  };

  // Handle campaign click - fetch details and open chatbot
  const handleCampaignClick = async (campaign, adAccountId) => {
    try {
      console.log("🎯 Campaign clicked:", campaign.name, campaign.id);
      
      setLoading(prev => ({ ...prev, campaigns: true }));
      setError("");
      
      // Fetch campaign details from singleCampaing API
      console.log(`📊 Fetching campaign details for: ${campaign.id}`);
      const campaignDetailsResponse = await fetch(
        `/api/facebook/singleCampaing?adAccountId=${adAccountId}&campaignId=${campaign.id}`
      );
      
      if (!campaignDetailsResponse.ok) {
        throw new Error(`Failed to fetch campaign details: ${campaignDetailsResponse.status}`);
      }
      
      const campaignDetailsData = await campaignDetailsResponse.json();
      console.log("✅ Campaign details fetched:", campaignDetailsData);
      
      // Prepare campaign data for chatbot
      const formattedCampaignData = {
        campaign_id: campaign.id,
        campaign_name: campaignDetailsData.campaign_name || campaign.name,
        objective: campaignDetailsData.objective || campaign.objective,
        ...campaignDetailsData
      };
      
      // Get stored auth data for Python API
      const authData = getStoredAuthData();
      
      // Send campaign data to Python API
      console.log("📤 Sending campaign data to Python API...");
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (authData && authData.access_token) {
        headers['Authorization'] = `Bearer ${authData.access_token}`;
      }
      
      const uploadResponse = await fetch(`${API_BASE_URL}/api/data/load`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formattedCampaignData)
      });
      
      if (uploadResponse.ok) {
        console.log("✅ Campaign data uploaded to Python API");
      } else {
        console.warn("⚠️ Failed to upload campaign data to Python API:", uploadResponse.status);
      }
      
      // Set campaign data and open chatbot
      setCampaignData(formattedCampaignData);
      setMessages([]);
      setHasLoadedConversations(false);
      setIsChatOpen(true);
      
    } catch (err) {
      console.error("Error handling campaign click:", err);
      setError("Error loading campaign details. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  // Loading Spinner Component
  const LoadingSpinner = ({ size = "medium" }) => {
    const sizeValues = {
      small: '48px',
      medium: '80px', 
      large: '96px'
    };

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div 
          style={{
            width: sizeValues[size],
            height: sizeValues[size],
            border: '4px solid rgba(0, 0, 0, 0.2)',
            borderTop: '4px solid #1877F2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '30px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '40px',
        background: '#ffffff',
        padding: '25px 30px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '800', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
        }}>
          Facebook Ad Accounts
        </h1>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
          }}
        >
          Logout
        </button>
      </div>

      {/* Ad Accounts Section */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#333', 
          marginBottom: '20px' 
        }}>
          Ad Accounts
        </h2>
        
        {loading.adAccounts ? (
          <LoadingSpinner />
        ) : error ? (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #f5c6cb',
            marginBottom: '20px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px'
          }}>
            {adAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => handleAccountClick(account.id)}
                style={{
                  cursor: 'pointer',
                  padding: '25px',
                  background: '#ffffff',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ 
                      fontSize: '20px', 
                      fontWeight: '700', 
                      color: '#1f2937',
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      {account.name}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: '#6b7280',
                    }}>
                      Account ID: {account.id}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      color: account.account_status === 1 ? '#059669' : '#dc2626',
                      fontWeight: '700',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: account.account_status === 1 
                        ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' 
                        : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {account.account_status === 1 ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaigns Section */}
      {selectedAccount && (
        <div style={{ 
          marginBottom: '40px', 
          background: '#ffffff',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '800', 
            marginBottom: '25px',
          }}>
            Campaigns
          </h2>
          
          {loading.campaigns ? (
            <LoadingSpinner />
          ) : campaigns.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: '20px'
            }}>
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => handleCampaignClick(campaign, selectedAccount)}
                  style={{
                    padding: '25px',
                    background: '#f9fafb',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#1f2937',
                        display: 'block',
                        marginBottom: '6px',
                      }}>
                        {campaign.name}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        color: '#6b7280',
                      }}>
                        ID: {campaign.id}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: campaign.status === 'ACTIVE' ? '#059669' : '#dc2626',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: campaign.status === 'ACTIVE' 
                          ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' 
                          : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#4b5563',
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '12px',
                  }}>
                    <span style={{ fontWeight: '700', marginRight: '8px' }}>Objective:</span>
                    {campaign.objective}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 40px',
              color: '#6b7280',
            }}>
              <p style={{ fontSize: '16px', fontWeight: '500' }}>
                No campaigns found for this ad account.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Chatbot Component */}
      <NewChatComponent
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        campaignData={campaignData}
        messages={messages}
        setMessages={setMessages}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
        hasLoadedConversations={hasLoadedConversations}
        setHasLoadedConversations={setHasLoadedConversations}
      />
    </div>
  );
}

