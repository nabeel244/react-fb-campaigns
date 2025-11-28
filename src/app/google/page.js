"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import NewChatComponent from "@/components/NewChatComponent";

// ===== CONFIGURATION =====
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_SANDBOX_MODE = process.env.NEXT_PUBLIC_USE_SANDBOX_MODE === 'true';
// =========================

export default function GoogleAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
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

  // Console log Google auth token and call login API
  useEffect(() => {
    if (USE_SANDBOX_MODE) {
      console.log("🔧 Sandbox mode enabled - bypassing session authentication");
    } else if (session?.accessToken && session?.provider === 'google') {
      console.log("🔑 Google Access Token:", session.accessToken);
      console.log("📊 Full Session Data:", session);
      
      // Call the Google login API
      callGoogleLoginAPI(session.accessToken);
    } else if (status === "unauthenticated") {
      console.log("❌ No Google token - User not authenticated");
    } else if (status === "loading") {
      console.log("⏳ Loading Google authentication...");
    }
  }, [session, status]);

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

  // Logout handler that clears localStorage and signs out
  const handleLogout = () => {
    console.log("🚪 Logging out - clearing all stored data...");
    
    // Clear all localStorage data
    localStorage.clear();
    
    // Reset all chat-related state
    setMessages([]);
    setIsTyping(false);
    setChatHistory([]);
    setCurrentChatId(null);
    setHasLoadedConversations(false);
    setCurrentCampaignId(null);
    
    // Reset campaign and account state
    setAdAccounts([]);
    setCampaigns([]);
    setSelectedAccount(null);
    setSelectedCampaignMetrics(null);
    setIsModalOpen(false);
    
    // Reset loading states
    setLoading({
      adAccounts: true,
      campaigns: false,
      campaignDetails: false
    });
    
    // Clear error state
    setError("");
    
    console.log("✅ All data cleared from localStorage and state reset");
    
    // Sign out from NextAuth
    signOut();
  };

  // Function to call Python API for Google login
  const callGoogleLoginAPI = async (accessToken) => {
    try {
      console.log("🚀 Calling Python API for Google login...");
      
      const response = await fetch(`${API_BASE_URL}/api/auth/google/login`, {
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
        console.log("✅ Python API Google login success:", data);
        
        // Save the response to localStorage for future API authorization
        localStorage.setItem('userAuth', JSON.stringify({
          user: data.user,
          access_token: data.access_token,
          token_type: data.token_type,
          expires_in: data.expires_in,
          loginTime: new Date().toISOString()
        }));
        
        console.log("💾 Auth data saved to localStorage");
        
      } else {
        const errorData = await response.json();
        console.error("❌ Python API Google login error:", errorData);
      }
    } catch (error) {
      console.error("❌ Error calling Python API:", error);
    }
  };
  
  // State management
  const [adAccounts, setAdAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedCampaignMetrics, setSelectedCampaignMetrics] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState({
    adAccounts: true,
    campaigns: false,
    campaignDetails: false
  });
  
  // Error state
  const [error, setError] = useState("");
  
  // Refs
  const textareaRef = useRef(null);

  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);
  const [currentCampaignId, setCurrentCampaignId] = useState(null);

  useEffect(() => {
    if (USE_SANDBOX_MODE) {
      console.log("🔧 Sandbox mode - skipping authentication check, fetching ad accounts directly");
      fetchAdAccounts();
    } else if (status === "unauthenticated" || (session?.provider !== 'google')) {
      router.push("/login");
      return;
    } else if (status === "authenticated" && session?.provider === 'google') {
      fetchAdAccounts();
    }
  }, [status, router, session]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isChatOpen]);

  const fetchAdAccounts = async () => {
    try {
      setLoading(prev => ({ ...prev, adAccounts: true }));
      setError("");
      
      const response = await fetch("/api/google/adaccounts");
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

  const handleAccountClick = async (customerId) => {
    try {
      setSelectedAccount(customerId);
      setLoading(prev => ({ ...prev, campaigns: true }));
      setError("");
      
      const response = await fetch(`/api/google/campaigns?customerId=${customerId}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setCampaigns(data?.data || []);
      }
    } catch (err) {
      setError("Error fetching campaigns");
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  const handleCampaignClick = async (campaign) => {
    try {
      setLoading(prev => ({ ...prev, campaignDetails: true }));
      setError("");
      // Reset all chat-related state for new campaign
      setHasLoadedConversations(false);
      setMessages([]);
      setCurrentCampaignId(campaign.id);
      console.log('🎯 Campaign clicked - ID:', campaign.id, 'Name:', campaign.name);
      
      const response = await fetch(`/api/google/singleCampaign?customerId=${selectedAccount}&campaignId=${campaign.id}`);
      const data = await response.json();
     
      if (data.error) {
        setError(data.error);
      } else {
        console.log('=== COMPLETE CAMPAIGN DATA OBJECT FOR BOT ===');
        console.log('Campaign ID:', campaign.id);
        console.log('Campaign Name:', data.campaign_name);
        console.log('Full Data Object:', JSON.stringify(data, null, 2));
        console.log('=== END CAMPAIGN DATA ===');
        
        setSelectedCampaignMetrics(data);
        
        // Send campaign data to Python API (similar to Facebook flow)
        try {
          const pythonApiPayload = {
            clicks: data.clicks?.toString() || "0",
            impressions: data.impressions?.toString() || "0",
            spend: data.spend?.toString() || "0",
            cpc: data.cpc?.toString() || "0",
            cpm: data.cpm?.toString() || "0",
            campaign_name: data.campaign_name || "",
            ctr: data.ctr?.toString() || "0",
            conversions: data.conversions?.toString() || "0",
            conversion_value: data.conversion_value?.toString() || "0",
            cost_per_conversion: data.cost_per_conversion?.toString() || "0",
            roas: data.roas?.toString() || "0",
            objective: data.objective || "",
            status: data.status || "",
            date_start: data.date_start || "",
            date_stop: data.date_stop || "",
            ad_groups: data.ad_groups || [],
            daily_insights: data.daily_insights || [],
          };

          console.log('Sending data to Python API:', pythonApiPayload);

          const authData = getStoredAuthData();
          const headers = {
            'Content-Type': 'application/json',
          };

          if (authData && isTokenValid(authData)) {
            headers['Authorization'] = `Bearer ${authData.access_token}`;
            console.log('🔐 Using stored auth token for data upload');
          } else {
            console.warn('⚠️ No valid auth token found for data upload');
          }

          const uploadResponse = await fetch(`${API_BASE_URL}/api/data/upload?campaign_id=${campaign.id}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(pythonApiPayload)
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log('Campaign data successfully sent to Python API:', uploadData);
            
            // Fetch conversations
            console.log(`✅ Campaign uploaded, fetching conversations...`);
            const conversationsResponse = await fetch(`${API_BASE_URL}/api/chat/conversations?campaign_id=${campaign.id}`, {
              method: 'GET',
              headers: headers
            });

            if (conversationsResponse.ok) {
              const conversationsData = await conversationsResponse.json();
              console.log('Conversations fetched successfully:', conversationsData);
              
              if (conversationsData && conversationsData.length > 0) {
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
                
                allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                
                if (allMessages.length > 0) {
                  setMessages(allMessages);
                  setHasLoadedConversations(true);
                  console.log('✅ Previous conversations loaded for campaign', campaign.id);
                }
              }
            }
          }
        } catch (pythonError) {
          console.error('Error sending data to Python API:', pythonError);
        }
        
        // Open chatbot
        const newChatId = Date.now().toString();
        setCurrentChatId(newChatId);
        setIsChatOpen(true);
      }
    } catch (err) {
      setError("Error fetching campaign insights");
      console.error("Error fetching campaign insights:", err);
    } finally {
      setLoading(prev => ({ ...prev, campaignDetails: false }));
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCampaignMetrics(null);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setMessages([]);
    setCurrentChatId(null);
    setHasLoadedConversations(false);
    setCurrentCampaignId(null);
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
            borderTop: '4px solid #000000',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
      </div>
    );
  };

  // Helper function to safely render values
  const renderValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value;
  };

  return (
    <div className="main-container" style={{ 
      padding: '30px', 
      background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
      minHeight: '100vh',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {status === "loading" ? (
        <LoadingSpinner size="large" />
      ) : isChatOpen ? (
        <>
          <NewChatComponent 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            campaignData={{
              ...selectedCampaignMetrics,
              campaign_id: currentCampaignId
            }}
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
        </>
      ) : (
        <>
          {/* Header */}
          <div className="header-container" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '40px',
            flexWrap: 'wrap',
            gap: '20px',
            background: '#ffffff',
            padding: '25px 30px',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h1 className="header-title" style={{ 
              fontSize: '32px', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              letterSpacing: '-0.5px'
            }}>
              Google Ads Accounts
            </h1>
            <button
              onClick={handleLogout}
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
                <button
                  onClick={fetchAdAccounts}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="ad-accounts-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px'
              }}>
                {adAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleAccountClick(account.id)}
                    className="card-padding"
                    style={{
                      cursor: 'pointer',
                      padding: '25px',
                      background: '#ffffff',
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: account.account_status === 1 
                        ? 'linear-gradient(90deg, #4ade80, #22c55e)' 
                        : 'linear-gradient(90deg, #f87171, #ef4444)',
                      borderRadius: '20px 20px 0 0'
                    }} />
                    <div className="card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="card-avatar" style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '18px'
                        }}>
                          {account.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="card-title" style={{ 
                            fontSize: '20px', 
                            fontWeight: '700', 
                            color: '#1f2937',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            {account.name}
                          </span>
                          <span className="card-subtitle" style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            fontWeight: '500'
                          }}>
                            ID: {account.id}
                          </span>
                          {account.currencyCode && (
                            <span className="card-subtitle" style={{
                              fontSize: '12px',
                              color: '#9ca3af',
                              fontWeight: '400',
                              display: 'block',
                              marginTop: '2px'
                            }}>
                              {account.currencyCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className="status-badge"
                        style={{
                          fontSize: '13px',
                          color: account.account_status === 1 ? '#059669' : '#dc2626',
                          fontWeight: '700',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          background: account.account_status === 1 
                            ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' 
                            : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                          border: account.account_status === 1 
                            ? '1px solid #a7f3d0' 
                            : '1px solid #fecaca',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
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
            <div className="campaigns-section" style={{ 
              marginBottom: '40px', 
              position: 'relative',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '800', 
                background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '25px',
                letterSpacing: '-0.5px'
              }}>
                Campaigns
              </h2>
              
              {loading.campaigns ? (
                <LoadingSpinner />
              ) : campaigns.length > 0 ? (
                <div style={{ position: 'relative' }}>
                  {loading.campaignDetails && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      borderRadius: '12px'
                    }}>
                      <LoadingSpinner size="large" />
                    </div>
                  )}
                  <div className="campaigns-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                    gap: '20px'
                  }}>
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        onClick={() => handleCampaignClick(campaign)}
                        style={{
                          padding: '25px',
                          background: '#ffffff',
                          borderRadius: '16px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                          cursor: loading.campaignDetails ? 'not-allowed' : 'pointer',
                          border: '1px solid #e5e7eb',
                          opacity: 1,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: campaign.status === 'ENABLED' 
                            ? 'linear-gradient(90deg, #4ade80, #22c55e)' 
                            : campaign.status === 'PAUSED'
                            ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                            : 'linear-gradient(90deg, #f87171, #ef4444)',
                          borderRadius: '16px 16px 0 0'
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', marginTop: '8px' }}>
                          <div style={{ flex: 1, marginRight: '15px' }}>
                            <span style={{ 
                              fontSize: '18px', 
                              fontWeight: '700', 
                              color: '#1f2937',
                              display: 'block',
                              marginBottom: '6px',
                              lineHeight: '1.4'
                            }}>
                              {campaign.name}
                            </span>
                            <span style={{
                              fontSize: '13px',
                              color: '#6b7280',
                              fontWeight: '500'
                            }}>
                              ID: {campaign.id}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '700',
                              color: campaign.status === 'ENABLED' ? '#059669' : campaign.status === 'PAUSED' ? '#d97706' : '#dc2626',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              background: campaign.status === 'ENABLED' 
                                ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' 
                                : campaign.status === 'PAUSED'
                                ? 'linear-gradient(135deg, #fef3c7, #fde68a)'
                                : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                              border: campaign.status === 'ENABLED' 
                                ? '1px solid #a7f3d0' 
                                : campaign.status === 'PAUSED'
                                ? '1px solid #fde68a'
                                : '1px solid #fecaca',
                              whiteSpace: 'nowrap',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#4b5563',
                          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontWeight: '500'
                        }}>
                          <span style={{ 
                            fontWeight: '700', 
                            color: '#374151',
                            marginRight: '8px'
                          }}>
                            Type:
                          </span>
                          {campaign.objective}
                        </div>
                        {campaign.impressions > 0 && (
                          <div style={{ 
                            marginTop: '12px',
                            display: 'flex',
                            gap: '12px',
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            <span>👁️ {campaign.impressions.toLocaleString()}</span>
                            <span>👆 {campaign.clicks.toLocaleString()}</span>
                            <span>💰 ${campaign.cost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 40px',
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderRadius: '16px',
                  color: '#6b7280',
                  border: '2px dashed #d1d5db'
                }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: '0.5'
                  }}>
                    📊
                  </div>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    margin: 0
                  }}>
                    No campaigns found for this ad account.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

