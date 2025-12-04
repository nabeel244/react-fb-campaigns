"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ===== CONFIGURATION =====
const USE_SANDBOX_MODE = process.env.NEXT_PUBLIC_USE_SANDBOX_MODE === 'true';
// =========================

export default function GoogleAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [adAccounts, setAdAccounts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState({ adAccounts: true, campaigns: false });
  const [error, setError] = useState("");

  // Fetch ad accounts when authenticated
  useEffect(() => {
    // Only redirect to login if user is completely unauthenticated or using wrong provider
    // Don't redirect on API errors - show error on dashboard instead
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    
    // If authenticated but wrong provider, redirect to login
    if (status === "authenticated" && session?.provider && session.provider !== 'google') {
      router.push("/login");
      return;
    }
    
    // If authenticated with Google (or sandbox mode), fetch accounts
    // Even if there's an error (403, etc.), stay on dashboard and show error
    if (USE_SANDBOX_MODE) {
      console.log("🔧 Sandbox mode - fetching ad accounts directly");
      fetchAdAccounts();
    } else if (status === "authenticated" && session?.provider === 'google') {
      console.log("🔑 Google Access Token:", session.accessToken);
      fetchAdAccounts();
    }
  }, [status, router, session]);

  const fetchAdAccounts = async () => {
    try {
      setLoading(prev => ({ ...prev, adAccounts: true }));
      setError("");
      
      console.log("📡 Fetching Google Ads accounts...");
      console.log("🔗 API URL: /api/google/adaccounts");
      
      // First test if routing works
      try {
        const testResponse = await fetch("/api/google/test");
        console.log("🧪 Test route status:", testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log("✅ Test route works:", testData);
        }
      } catch (testErr) {
        console.error("❌ Test route failed:", testErr);
      }
      
      const response = await fetch("/api/google/adaccounts");
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        console.error("❌ API response not OK:", response.status, response.statusText);
        let errorText = '';
        try {
          errorText = await response.text();
          console.error("❌ Error response body:", errorText);
        } catch (e) {
          errorText = response.statusText;
        }
        
        // Parse error if it's JSON
        let errorMessage = `API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
          if (errorData.details && typeof errorData.details === 'string') {
            errorMessage += ` - ${errorData.details}`;
          }
        } catch (e) {
          // Not JSON, use text as-is
          if (errorText && errorText.length < 200) {
            errorMessage = errorText;
          }
        }
        
        setError(errorMessage);
        setAdAccounts([]); // Clear accounts on error
        return; // Stay on dashboard, don't redirect
      }
      
      const data = await response.json();
      console.log("📦 Response data:", data);
      
      if (data.error) {
        setError(data.error + (data.details ? ` - ${data.details}` : ''));
        console.error("❌ Error from API:", data.error);
        setAdAccounts([]); // Clear accounts on error
      } else {
        setAdAccounts(data?.data || []);
        console.log("✅ Google Ads accounts fetched:", data?.data?.length || 0);
      }
    } catch (err) {
      setError("Error fetching ad accounts");
      console.error("Error fetching ad accounts:", err);
    } finally {
      setLoading(prev => ({ ...prev, adAccounts: false }));
    }
  };

  // Handle account click - fetch campaigns
  const handleAccountClick = async (customerId) => {
    try {
      setSelectedAccount(customerId);
      setLoading(prev => ({ ...prev, campaigns: true }));
      setError("");
      
      console.log(`📊 Fetching campaigns for account: ${customerId}`);
      
      const response = await fetch(`/api/google/campaigns?customerId=${customerId}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setCampaigns([]);
      } else {
        const campaignsData = data?.data || [];
        setCampaigns(campaignsData);
        
        // If we have campaigns (including mock data), don't show error
        if (campaignsData.length > 0) {
          setError(""); // Clear any errors if we have campaigns
        } else if (data.meta?.error && (
          data.meta.error.includes('REST API') || 
          data.meta.error.includes('REST_API_LIMITATION') ||
          data.meta.error.includes('REST API limitation')
        )) {
          // Only show error if we have no campaigns
          setError(data.meta?.message || "Campaigns cannot be fetched via REST API");
        } else {
          // Clear error
          setError("");
        }
        
        console.log(`✅ Fetched ${campaignsData.length} campaigns`);
        if (data.meta?.isMockData) {
          console.log(`🧪 Showing mock campaign data for testing`);
        }
        if (data.meta?.message && campaignsData.length === 0) {
          console.log(`ℹ️ Info: ${data.meta.message}`);
        }
      }
    } catch (err) {
      setError("Error fetching campaigns");
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  };

  // Logout handler
  const handleLogout = () => {
    console.log("🚪 Logging out...");
    setAdAccounts([]);
    setCampaigns([]);
    setSelectedAccount(null);
    setError("");
    signOut();
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
            borderTop: '4px solid #4285f4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
      </div>
    );
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
                backgroundColor: '#fff3cd',
                color: '#856404',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #ffc107',
                marginBottom: '20px',
                boxShadow: '0 4px 12px rgba(255, 193, 7, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '24px' }}>⚠️</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                      Error Loading Google Ads Accounts
                    </strong>
                    <div style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '12px' }}>
                      {error}
                    </div>
                    {error.includes('403') && (
                      <div style={{
                        backgroundColor: '#fff',
                        padding: '12px',
                        borderRadius: '8px',
                        marginTop: '12px',
                        fontSize: '13px',
                        border: '1px solid #ffc107'
                      }}>
                        <strong>Possible Solutions:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          <li>Check that your Google Ads Developer Token has the correct access level</li>
                          <li>Ensure your OAuth token has the required Google Ads API scope</li>
                          <li>Verify that your account has access to Google Ads accounts</li>
                          <li>Try logging out and logging back in to refresh your access token</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={fetchAdAccounts}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ffc107',
                    color: '#856404',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ffb300';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#ffc107';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            ) : (
              <div className="ad-accounts-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '20px'
              }}>
                {adAccounts.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 40px',
                    background: '#ffffff',
                    borderRadius: '20px',
                    color: '#6b7280',
                    border: '2px dashed #d1d5db',
                    gridColumn: '1 / -1'
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
                      No Google Ads accounts found.
                    </p>
                  </div>
                ) : (
                  adAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handleAccountClick(account.id)}
                      className="card-padding"
                      style={{
                        padding: '25px',
                        background: '#ffffff',
                        borderRadius: '20px',
                        boxShadow: selectedAccount === account.id 
                          ? '0 8px 32px rgba(66, 133, 244, 0.3)' 
                          : '0 8px 32px rgba(0, 0, 0, 0.1)',
                        border: selectedAccount === account.id 
                          ? '2px solid #4285f4' 
                          : '1px solid #e5e7eb',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: selectedAccount === account.id ? 'scale(1.02)' : 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedAccount !== account.id) {
                          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedAccount !== account.id) {
                          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      <div style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: account.accountStatus === 1 
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
                            color: account.accountStatus === 1 ? '#059669' : '#dc2626',
                            fontWeight: '700',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: account.accountStatus === 1 
                              ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' 
                              : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                            border: account.accountStatus === 1 
                              ? '1px solid #a7f3d0' 
                              : '1px solid #fecaca',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        >
                          {account.accountStatus === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Campaigns Section */}
          {selectedAccount && (
            <div style={{ marginTop: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <h2 style={{ 
                  fontSize: '24px', 
                  fontWeight: '600', 
                  color: '#333', 
                  margin: 0
                }}>
                  Campaigns
                </h2>
                {campaigns.length > 0 && (
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    background: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    🧪 Test Data
                  </span>
                )}
              </div>
              
              {loading.campaigns ? (
                <LoadingSpinner />
              ) : (
                <div className="campaigns-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '20px'
                }}>
                  {campaigns.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 40px',
                      background: '#ffffff',
                      borderRadius: '20px',
                      color: '#6b7280',
                      border: '2px dashed #d1d5db',
                      gridColumn: '1 / -1'
                    }}>
                      <div style={{
                        fontSize: '48px',
                        marginBottom: '16px',
                        opacity: '0.5'
                      }}>
                        📈
                      </div>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        margin: '0 0 12px 0',
                        color: '#1f2937'
                      }}>
                        {'No campaigns found for this account.'}
                      </p>
                      {error && (error.includes('REST API') || error.includes('REST_API_LIMITATION')) && (
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: '8px 0 0 0',
                          maxWidth: '600px',
                          marginLeft: 'auto',
                          marginRight: 'auto',
                          lineHeight: '1.6',
                          padding: '16px',
                          background: '#fef3c7',
                          borderRadius: '8px',
                          border: '1px solid #fbbf24'
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#92400e' }}>
                            ℹ️ Testing with Mock Data
                          </p>
                          <p style={{ margin: 0, color: '#78350f' }}>
                            The Google Ads API REST interface doesn't support querying campaigns. Showing mock/test campaigns for demonstration. To fetch real campaigns, use the Google Ads API client library (gRPC).
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        style={{
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
                          background: campaign.status === 'ENABLED' 
                            ? 'linear-gradient(90deg, #4ade80, #22c55e)' 
                            : campaign.status === 'PAUSED'
                            ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                            : 'linear-gradient(90deg, #f87171, #ef4444)',
                          borderRadius: '20px 20px 0 0'
                        }} />
                        <div style={{ marginTop: '8px' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            color: '#1f2937',
                            marginBottom: '12px'
                          }}>
                            {campaign.name}
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>Status:</span>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: campaign.status === 'ENABLED' ? '#059669' : campaign.status === 'PAUSED' ? '#d97706' : '#dc2626',
                                  fontWeight: '700',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  background: campaign.status === 'ENABLED' 
                                    ? '#d1fae5' 
                                    : campaign.status === 'PAUSED'
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {campaign.status || 'UNKNOWN'}
                              </span>
                            </div>
                            {campaign.advertisingChannelType && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Type:</span>
                                <span style={{ fontSize: '12px', color: '#1f2937', fontWeight: '500' }}>
                                  {campaign.advertisingChannelType}
                                </span>
                              </div>
                            )}
                            {campaign.startDate && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Start:</span>
                                <span style={{ fontSize: '12px', color: '#1f2937', fontWeight: '500' }}>
                                  {campaign.startDate}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
