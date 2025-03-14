"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adAccounts, setAdAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login"); // Redirect to login if not logged in
    }

    if (status === "authenticated") {
      fetch("/api/facebook/adaccounts")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setAdAccounts(data?.data || []);
          }
          setLoading(false);
        })
        .catch((err) => {
          setError("Error fetching ad accounts");
          setLoading(false);
        });
    }
  }, [status, router]);

  const handleAccountClick = (adAccountId) => {
    setSelectedAccount(adAccountId);
    fetch(`/api/facebook/campaigns?adAccountId=${adAccountId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setCampaigns(data?.data || []);
        }
      })
      .catch((err) => {
        setError("Error fetching campaigns");
      });
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f5f5f5' }}>
      {status === "loading" ? (
        <p>Loading...</p>
      ) : (
        <>
          <h1 style={{ fontSize: '30px', fontWeight: '700', marginBottom: '20px' }}>Facebook Ad Accounts</h1>
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
            }}
          >
            Logout
          </button>

          {loading ? (
            <p>Loading ad accounts...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <div style={{ marginTop: '20px' }}>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {adAccounts.map((account) => (
                  <li
                    key={account.id}
                    onClick={() => handleAccountClick(account.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '15px',
                      backgroundColor: 'white',
                      marginBottom: '15px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease-in-out',
                    }}
                    onMouseOver={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
                    onMouseOut={(e) => (e.target.style.backgroundColor = 'white')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: '500' }}>{account.name}</span>
                      <span
                        style={{
                          fontSize: '14px',
                          color: account.account_status === 1 ? 'green' : 'red',
                          fontWeight: '500',
                        }}
                      >
                        {account.account_status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedAccount && (
            <div style={{ marginTop: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Campaigns for {selectedAccount}</h2>
              {campaigns.length === 0 ? (
                <p>No campaigns available for this account.</p>
              ) : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {campaigns.map((campaign) => (
                    <li
                      key={campaign.id}
                      style={{
                        padding: '12px',
                        marginBottom: '12px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: '500' }}>{campaign.name}</span>
                        <span
                          style={{
                            fontSize: '14px',
                            color: campaign.status === 'ACTIVE' ? 'green' : 'red',
                            fontWeight: '500',
                          }}
                        >
                          {campaign.status} | {campaign.objective}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
