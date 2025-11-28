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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch ad accounts when authenticated
  useEffect(() => {
    if (USE_SANDBOX_MODE) {
      console.log("🔧 Sandbox mode - fetching ad accounts directly");
      fetchAdAccounts();
    } else if (status === "unauthenticated" || (session?.provider !== 'google')) {
      router.push("/login");
      return;
    } else if (status === "authenticated" && session?.provider === 'google') {
      console.log("🔑 Google Access Token:", session.accessToken);
      fetchAdAccounts();
    }
  }, [status, router, session]);

  const fetchAdAccounts = async () => {
    try {
      setLoading(true);
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
        const errorText = await response.text();
        console.error("❌ Error response body:", errorText);
        setError(`API Error: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log("📦 Response data:", data);
      
      if (data.error) {
        setError(data.error);
        console.error("❌ Error from API:", data.error);
      } else {
        setAdAccounts(data?.data || []);
        console.log("✅ Google Ads accounts fetched:", data?.data?.length || 0);
      }
    } catch (err) {
      setError("Error fetching ad accounts");
      console.error("Error fetching ad accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    console.log("🚪 Logging out...");
    setAdAccounts([]);
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
            
            {loading ? (
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
                      className="card-padding"
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
        </>
      )}
    </div>
  );
}
