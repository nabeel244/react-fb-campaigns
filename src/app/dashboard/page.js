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
  const [loading, setLoading] = useState({ adAccounts: true, campaigns: false, campaignDetails: false });
  const [error, setError] = useState("");
  
  // Chat state management
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [campaignData, setCampaignData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);

  // Helper function to get stored auth data
  const getStoredAuthData = () => {
    try {
      const authData = localStorage.getItem('userAuth');
      if (authData) {
        const parsed = JSON.parse(authData);
        console.log("📋 Retrieved stored auth data:", {
          user: parsed.user,
          token: parsed.access_token?.substring(0, 20) + "...",
          expires_in: parsed.expires_in
        });
        return parsed;
      }
    } catch (error) {
      console.error("❌ Error retrieving stored auth data:", error);
    }
    return null;
  };

  // Helper function to check if token is still valid
  const isTokenValid = (authData) => {
    if (!authData || !authData.loginTime || !authData.expires_in) {
      return false;
    }
    
    const loginTime = new Date(authData.loginTime);
    const expirationTime = new Date(loginTime.getTime() + (authData.expires_in * 1000));
    const now = new Date();
    
    return now < expirationTime;
  };

  // Function to call Python API for Facebook login
  const callFacebookLoginAPI = async (accessToken) => {
    try {
      console.log("🚀 Calling Python API for Facebook login...");
      
      const response = await fetch(`${API_BASE_URL}/api/auth/facebook/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: accessToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Python API Facebook login success:", data);
        
        // Save the response to localStorage for future API authorization
        localStorage.setItem('userAuth', JSON.stringify({
          user: data.user,
          access_token: data.access_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
          loginTime: new Date().toISOString()
        }));
        
        console.log("💾 Auth data saved to localStorage:", {
          user: data.user,
          token: data.access_token.substring(0, 20) + "...",
          expires_in: data.expires_in
        });
        
        // Fetch ad accounts after successful login
        fetchAdAccounts();
      } else {
        const errorData = await response.json();
        console.error("❌ Python API Facebook login error:", errorData);
      }
    } catch (error) {
      console.error("❌ Error calling Python API:", error);
    }
  };

  // Check for existing auth data on component load
  useEffect(() => {
    const storedAuth = getStoredAuthData();
    if (storedAuth) {
      if (isTokenValid(storedAuth)) {
        console.log("✅ Valid stored auth token found");
      } else {
        console.log("⏰ Stored auth token has expired, clearing localStorage");
        localStorage.removeItem('userAuth');
      }
    }
  }, []);

  // Console log Facebook auth token and call login API
  useEffect(() => {
    if (USE_SANDBOX_MODE) {
      console.log("🔧 Sandbox mode enabled - bypassing session authentication");
      // In sandbox mode, we don't need session authentication
      // The Facebook APIs will use the hardcoded sandbox token
      fetchAdAccounts();
    } else if (session?.accessToken && session?.provider === 'facebook') {
      console.log("🔑 Facebook Access Token:", session.accessToken);
      console.log("📊 Full Session Data:", session);
      
      // Call the Facebook login API
      callFacebookLoginAPI(session.accessToken);
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
  }, [session, status]);

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

  // Handle campaign click - fetch details and open chatbot
  const handleCampaignClick = async (campaign, adAccountId) => {
    try {
      setLoading(prev => ({ ...prev, campaignDetails: true }));
      setError("");
      // Reset all chat-related state for new campaign
      setHasLoadedConversations(false);
      setMessages([]); // Clear previous messages
      console.log('🎯 Campaign clicked - ID:', campaign.id, 'Name:', campaign.name);
      console.log('🔄 Reset conversation state for new campaign');

      const response = await fetch(`/api/facebook/singleCampaing?adAccountId=${adAccountId}&campaignId=${campaign.id}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        // Convert campaign data to the format expected by Python API
        const convertedData = {
          campaign_id: campaign.id,
          campaign_name: data.campaign_name || campaign.name,
          objective: data.objective || campaign.objective,
          date_start: data.date_start,
          date_stop: data.date_stop,
          clicks: data.clicks?.toString() || "0",
          impressions: data.impressions?.toString() || "0",
          spend: data.spend ? (parseFloat(data.spend) / 100).toString() : "0",
          cpc: data.cpc ? (parseFloat(data.cpc) / 100).toString() : "0",
          cpm: data.cpm ? (parseFloat(data.cpm) / 100).toString() : "0",
          ctr: data.ctr?.toString() || "0",
          cpp: data.cpp ? (parseFloat(data.cpp) / 100).toString() : "0",
          reach: data.reach?.toString() || "0",
          frequency: data.frequency?.toString() || "0",
          conversions: data.conversions?.toString() || "0",
          conversion_values: data.conversion_values?.toString() || "0",
          cost_per_conversion: data.cost_per_conversion ? (parseFloat(data.cost_per_conversion) / 100).toString() : "0",
          website_purchase_roas: data.website_purchase_roas?.toString() || "0",
        };

        setCampaignData(convertedData);

        // Send campaign data to Python API
        try {
          const pythonApiPayload = {
            clicks: convertedData.clicks?.toString() || "0",
            impressions: convertedData.impressions?.toString() || "0",
            spend: convertedData.spend || "0",
            cpc: convertedData.cpc || "0",
            cpm: convertedData.cpm || "0",
            ctr: convertedData.ctr?.toString() || "0",
            cpp: convertedData.cpp || "0",
            reach: convertedData.reach?.toString() || "0",
            frequency: convertedData.frequency?.toString() || "0",
            conversions: convertedData.conversions?.toString() || "0",
            conversion_values: convertedData.conversion_values?.toString() || "0",
            cost_per_conversion: convertedData.cost_per_conversion || "0",
            website_purchase_roas: convertedData.website_purchase_roas?.toString() || "0",
            campaign_id: campaign.id,
            campaign_name: convertedData.campaign_name,
            objective: convertedData.objective,
            date_start: convertedData.date_start,
            date_stop: convertedData.date_stop,
          };

          console.log('Sending data to Python API:', pythonApiPayload);

          // Get stored auth token for authorization
          const authData = getStoredAuthData();
          const headers = {
            'Content-Type': 'application/json',
          };

          // Add authorization header if token is available and valid
          if (authData && isTokenValid(authData)) {
            headers['Authorization'] = `Bearer ${authData.access_token}`;
            console.log('🔐 Using stored auth token for data upload');
          } else {
            console.warn('⚠️ No valid auth token found for data upload');
          }

          // Send campaign data to upload API
          console.log(`📤 Uploading campaign ${campaign.id} data...`);
          const uploadResponse = await fetch(`${API_BASE_URL}/api/data/upload?campaign_id=${campaign.id}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(pythonApiPayload)
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log('Campaign data successfully sent to Python API:', uploadData);
            
            // Fetch conversations directly (no load API needed)
            console.log(`✅ Campaign uploaded, fetching conversations...`);
            const conversationsResponse = await fetch(`${API_BASE_URL}/api/chat/conversations?campaign_id=${campaign.id}`, {
              method: 'GET',
              headers: headers
            });

            if (conversationsResponse.ok) {
              const conversationsData = await conversationsResponse.json();
              console.log('Conversations fetched successfully:', conversationsData);
              
              // Process and display messages in chat
              if (conversationsData && conversationsData.length > 0) {
                // Get all messages from all conversations and sort by timestamp
                const allMessages = [];
                conversationsData.forEach(conversation => {
                  if (conversation.messages && conversation.messages.length > 0) {
                    conversation.messages.forEach(msg => {
                      allMessages.push({
                        id: msg.id,
                        type: msg.role === 'user' ? 'user' : 'bot',
                        message: msg.content,
                        timestamp: new Date(msg.created_at)
                      });
                    });
                  }
                });
                
                // Sort messages by timestamp to show them in chronological order
                allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                if (allMessages.length > 0) {
                  // Store messages to be loaded when chat opens
                  setMessages(allMessages);
                  setHasLoadedConversations(true);
                  console.log('✅ Previous conversations loaded for campaign', campaign.id, ':', allMessages);
                } else {
                  console.log('ℹ️ No previous conversations found for campaign', campaign.id);
                }
              }
            } else {
              console.error('Failed to fetch conversations:', conversationsResponse.statusText);
            }
          } else {
            console.error('Failed to send data to Python API:', uploadResponse.statusText);
          }
        } catch (pythonError) {
          console.error('Error sending data to Python API:', pythonError);
        }
        
        // Open chatbot and create new chat session
        const newChatId = Date.now().toString();
        setCurrentChatId(newChatId);
        
        // Open chat - let NewChatComponent handle message initialization
        setIsChatOpen(true);
      }
    } catch (err) {
      setError("Error fetching campaign insights");
      console.error("Error fetching campaign insights:", err);
    } finally {
      setLoading(prev => ({ ...prev, campaignDetails: false }));
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

