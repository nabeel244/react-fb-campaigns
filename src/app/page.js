"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchAdAccounts();
    }
  }, [status, router]);

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
      
      const response = await fetch(`/api/facebook/singleCampaing?adAccountId=${selectedAccount}&campaignId=${campaign.id}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        // Console log the complete campaign data object for bot integration
        console.log('=== COMPLETE CAMPAIGN DATA OBJECT FOR BOT ===');
        console.log('Campaign ID:', campaign.id);
        console.log('Campaign Name:', data.campaign_name);
        console.log('Full Data Object:', JSON.stringify(data, null, 2));
        console.log('=== END CAMPAIGN DATA ===');
        
        setSelectedCampaignMetrics(data);
        setIsModalOpen(true);
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


  // Loading Spinner Component
  const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
    const sizeClasses = {
      small: "w-4 h-4",
      medium: "w-8 h-8", 
      large: "w-12 h-12"
    };

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px',
        gap: '10px'
      }}>
        <div 
          className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}
        ></div>
        <p style={{ color: '#666', fontSize: '14px' }}>{text}</p>
      </div>
    );
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {status === "loading" ? (
        <LoadingSpinner size="large" text="Authenticating..." />
      ) : (
        <>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <h1 style={{ 
              fontSize: '30px', 
              fontWeight: '700', 
              color: '#5A9EC9',
              margin: 0
            }}>
              Facebook Ad Accounts
            </h1>
            <button
              onClick={() => signOut()}
              style={{
                backgroundColor: '#e53e3e',
                color: 'white',
                padding: '12px 18px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#c53030'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#e53e3e'}
            >
              Logout
            </button>
          </div>

          {/* Campaign Modal */}
          {isModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}>
              {loading.campaignDetails ? (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '40px',
                  textAlign: 'center',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}>
                  <LoadingSpinner size="large" text="Loading campaign details..." />
                </div>
              ) : selectedCampaignMetrics ? (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '20px',
                  padding: '30px',
                  maxWidth: '900px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#1877F2 #f0f0f0'
                }}>
                  {/* Close Button */}
                  <button
                    onClick={closeModal}
                    style={{
                      position: 'absolute',
                      top: '15px',
                      right: '20px',
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#666',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>

                  {/* Campaign Header */}
                  <div style={{ marginBottom: '30px', borderBottom: '2px solid #f0f0f0', paddingBottom: '20px' }}>
                    <h2 style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      color: '#1877F2', 
                      marginBottom: '10px',
                      marginRight: '40px'
                    }}>
                      {selectedCampaignMetrics.campaign_name}
                    </h2>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{
                        backgroundColor: selectedCampaignMetrics.quality_ranking === 'ABOVE_AVERAGE' ? '#d4edda' : '#f8d7da',
                        color: selectedCampaignMetrics.quality_ranking === 'ABOVE_AVERAGE' ? '#155724' : '#721c24',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        Quality: {selectedCampaignMetrics.quality_ranking}
                      </span>
                      <span style={{
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {selectedCampaignMetrics.objective}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '20px',
                    marginBottom: '30px'
                  }}>
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#1877F2', marginBottom: '5px' }}>
                        {selectedCampaignMetrics.clicks}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Clicks</div>
                    </div>
                    
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '5px' }}>
                        {selectedCampaignMetrics.impressions?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Impressions</div>
                    </div>
                    
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc3545', marginBottom: '5px' }}>
                        ${selectedCampaignMetrics.spend}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>Spend</div>
                    </div>
                    
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107', marginBottom: '5px' }}>
                        {selectedCampaignMetrics.ctr}%
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', fontWeight: '600' }}>CTR</div>
                    </div>
                  </div>

                  {/* Performance Details */}
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                      Performance Details
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                      gap: '15px' 
                    }}>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>CPC:</strong> ${selectedCampaignMetrics.cpc}
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>CPM:</strong> ${selectedCampaignMetrics.cpm}
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>Reach:</strong> {selectedCampaignMetrics.reach?.toLocaleString()}
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>Frequency:</strong> {selectedCampaignMetrics.frequency}
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>CPP:</strong> ${selectedCampaignMetrics.cpp}
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>Social Spend:</strong> ${selectedCampaignMetrics.social_spend}
                      </div>
                    </div>
                  </div>

                  {/* Conversion & Value Metrics */}
                  {(selectedCampaignMetrics.conversions || selectedCampaignMetrics.website_purchase_roas) && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                        Conversion & Value Metrics
                      </h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '15px' 
                      }}>
                        {selectedCampaignMetrics.conversions && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>Conversions:</strong> {selectedCampaignMetrics.conversions}
                          </div>
                        )}
                        {selectedCampaignMetrics.website_purchase_roas && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>ROAS:</strong> {selectedCampaignMetrics.website_purchase_roas}x
                          </div>
                        )}
                        {selectedCampaignMetrics.cost_per_conversion && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>Cost per Conversion:</strong> ${selectedCampaignMetrics.cost_per_conversion}
                          </div>
                        )}
                        {selectedCampaignMetrics.cost_per_purchase && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>Cost per Purchase:</strong> ${selectedCampaignMetrics.cost_per_purchase}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions & Engagement Metrics */}
                  {(selectedCampaignMetrics.actions || selectedCampaignMetrics.action_values) && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                        Engagement Metrics
                      </h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '15px' 
                      }}>
                        {selectedCampaignMetrics.actions && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Actions:</strong> {JSON.stringify(selectedCampaignMetrics.actions)}
                          </div>
                        )}
                        {selectedCampaignMetrics.action_values && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Action Values:</strong> {JSON.stringify(selectedCampaignMetrics.action_values)}
                          </div>
                        )}
                        {selectedCampaignMetrics.post_reactions && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Post Reactions:</strong> {selectedCampaignMetrics.post_reactions}
                          </div>
                        )}
                        {selectedCampaignMetrics.post_comments && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Post Comments:</strong> {selectedCampaignMetrics.post_comments}
                          </div>
                        )}
                        {selectedCampaignMetrics.post_shares && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Post Shares:</strong> {selectedCampaignMetrics.post_shares}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Outbound & Link Metrics */}
                  {(selectedCampaignMetrics.outbound_clicks || selectedCampaignMetrics.unique_clicks) && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                        Outbound & Link Metrics
                      </h3>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '15px' 
                      }}>
                        {selectedCampaignMetrics.outbound_clicks && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Outbound Clicks:</strong> {selectedCampaignMetrics.outbound_clicks}
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_clicks && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique Clicks:</strong> {selectedCampaignMetrics.unique_clicks}
                          </div>
                        )}
                        {selectedCampaignMetrics.outbound_clicks_ctr && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Outbound CTR:</strong> {selectedCampaignMetrics.outbound_clicks_ctr}%
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_ctr && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique CTR:</strong> {selectedCampaignMetrics.unique_ctr}%
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_outbound_clicks && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique Outbound Clicks:</strong> {selectedCampaignMetrics.unique_outbound_clicks}
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_outbound_clicks_ctr && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique Outbound CTR:</strong> {selectedCampaignMetrics.unique_outbound_clicks_ctr}%
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Campaign Period */}
                  <div style={{ marginBottom: '30px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                      Campaign Period
                    </h3>
                    <div style={{ 
                      padding: '15px', 
                      backgroundColor: '#e3f2fd', 
                      borderRadius: '8px',
                      borderLeft: '4px solid #1877F2'
                    }}>
                      <strong>Start:</strong> {selectedCampaignMetrics.date_start}<br/>
                      <strong>End:</strong> {selectedCampaignMetrics.date_stop}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={closeModal}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        // Future: Export or analyze functionality
                        console.log('Export campaign data');
                      }}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#1877F2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}
                    >
                      Export Data
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

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
              <LoadingSpinner text="Loading ad accounts..." />
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
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                gap: '20px' 
              }}>
                {adAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleAccountClick(account.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '20px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease-in-out',
                      border: '1px solid #e9ecef'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#333' 
                      }}>
                        {account.name}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          color: account.account_status === 1 ? '#28a745' : '#dc3545',
                          fontWeight: '600',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: account.account_status === 1 ? '#d4edda' : '#f8d7da'
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
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                color: '#333',
                marginBottom: '20px'
              }}>
                Campaigns
              </h2>
              
              {loading.campaigns ? (
                <LoadingSpinner text="Loading campaigns..." />
              ) : campaigns.length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                  gap: '20px' 
                }}>
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => handleCampaignClick(campaign)}
                      style={{
                        padding: '20px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease-in-out',
                        border: '1px solid #e9ecef',
                        opacity: campaign.status === 'PAUSED' ? 0.7 : 1
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.12)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '700', 
                          color: '#333',
                          flex: 1,
                          marginRight: '10px'
                        }}>
                          {campaign.name}
                        </span>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: campaign.status === 'ACTIVE' ? '#28a745' : '#dc3545',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: campaign.status === 'ACTIVE' ? '#d4edda' : '#f8d7da',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#666',
                        backgroundColor: '#f8f9fa',
                        padding: '8px 12px',
                        borderRadius: '6px'
                      }}>
                        <strong>Objective:</strong> {campaign.objective}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  color: '#666'
                }}>
                  <p>No campaigns found for this ad account.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}