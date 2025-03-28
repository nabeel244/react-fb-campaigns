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
  const [selectedCampaignMetrics, setSelectedCampaignMetrics] = useState(null);
  const [messages, setMessages] = useState([]);  // For chat history
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);  // Loader for OpenAI response

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
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

  const handleCampaignClick = (campaign) => {
    const campaignId = campaign.id;
    const campaignName = campaign.name
    setIsLoading(true);
    setMessages([]);
    fetch(`/api/facebook/singleCampaing?adAccountId=${selectedAccount}&campaignId=${campaignId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          console.log(data, 'data')
          setSelectedCampaignMetrics(data);  // Set the campaign metrics
          setMessages([{ role: 'assistant', content: `You selected campaign "${campaignName}". How can I help you improve this campaign?` }]);  // Start the conversation
        }
      })
      .catch((err) => {
        setError("Error fetching campaign insights");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const [isCampaignMessageSent, setIsCampaignMessageSent] = useState(false); // Flag to track if campaign message is sent

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    // Add user input to the message history
    const newMessage = { role: "user", content: userInput };

    // Include campaign metrics in the conversation for context (only if it's not already sent)
    const campaignMetricsMessage = {
      role: "assistant",
      content: `Campaign data: 
      Campaign Name: ${selectedCampaignMetrics?.campaign_name}, 
      Clicks: ${selectedCampaignMetrics?.clicks}, 
      Impressions: ${selectedCampaignMetrics?.impressions}, 
      Spend: ${selectedCampaignMetrics?.spend}, 
      CPC: ${selectedCampaignMetrics?.cpc}, 
      CPM: ${selectedCampaignMetrics?.cpm}, 
      Conversion Rate Ranking: ${selectedCampaignMetrics?.conversion_rate_ranking}, 
      Cost per Action Type: ${JSON.stringify(selectedCampaignMetrics?.cost_per_action_type)}, 
      Cost per Unique Click: ${selectedCampaignMetrics?.cost_per_unique_click}, 
      Cost per Unique Outbound Click: ${JSON.stringify(selectedCampaignMetrics?.cost_per_unique_outbound_click)}, 
      CTR: ${selectedCampaignMetrics?.ctr}, 
      CPP: ${selectedCampaignMetrics?.cpp}, 
      Objective: ${selectedCampaignMetrics?.objective}, 
      Social Spend: ${selectedCampaignMetrics?.social_spend}, 
      Quality Ranking: ${selectedCampaignMetrics?.quality_ranking}, 
      Reach: ${selectedCampaignMetrics?.reach}, 
      Frequency: ${selectedCampaignMetrics?.frequency}, 
      Start Date: ${selectedCampaignMetrics?.date_start}, 
      End Date: ${selectedCampaignMetrics?.date_stop}`
    };

    // If campaign metrics message has not been sent, add it to the message history
    if (!isCampaignMessageSent) {
      setMessages((prevMessages) => [
        ...prevMessages,
        campaignMetricsMessage,  // Add campaign metrics message only once
        newMessage,
      ]);
      setIsCampaignMessageSent(true); // Set flag to true after adding the campaign message
    } else {
      // If campaign metrics message is already sent, only add the user message
      setMessages((prevMessages) => [
        ...prevMessages,
        newMessage,
      ]);
    }

    setIsLoading(true);

    function fetchWithTimeout(url, options, timeout = 15000) {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), timeout)
        ),
      ]);
    }

    async function postWithRetry(url, options, retries = 3, delay = 1000) {
      while (retries > 0) {
        try {
          const response = await fetch(url, options);
          if (response.ok) return response;
          throw new Error("Failed request");
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log("Retrying...");
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Send the chat history (including campaign data and user input) to the OpenAI API for response
    postWithRetry("/api/conversation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationHistory: [
          ...messages,
          ...(isCampaignMessageSent ? [] : [campaignMetricsMessage]), // Add campaign data only if it's not already sent
          newMessage,
        ],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          // Append OpenAI's response to the chat
          setMessages((prevMessages) => [
            ...prevMessages,
            { role: "assistant", content: data.response },
          ]);
        }
      })
      .catch((err) => {
        console.log('error fetching opean ai response')
        // setError("Error fetching OpenAI response");
      })
      .finally(() => {
        setIsLoading(false);
        setUserInput("");  // Clear the input field after sending the message
      });
  };

  // const handleSendMessage = () => {
  //   if (!userInput.trim()) return;
  //   // Add user input to the message history
  //   const newMessage = { role: "user", content: userInput };

  //   // Include campaign metrics in the conversation for context
  //   const campaignMetricsMessage = {
  //     role: "assistant",
  //     content: `Campaign data: 
  //       Campaign Name: ${selectedCampaignMetrics?.campaign_name}, 
  //       Clicks: ${selectedCampaignMetrics?.clicks}, 
  //       Impressions: ${selectedCampaignMetrics?.impressions}, 
  //       Spend: ${selectedCampaignMetrics?.spend}, 
  //       CPC: ${selectedCampaignMetrics?.cpc}, 
  //       CPM: ${selectedCampaignMetrics?.cpm}, 
  //       Conversion Rate Ranking: ${selectedCampaignMetrics?.conversion_rate_ranking}, 
  //       Cost per Action Type: ${JSON.stringify(selectedCampaignMetrics?.cost_per_action_type)}, 
  //       Cost per Unique Click: ${selectedCampaignMetrics?.cost_per_unique_click}, 
  //       Cost per Unique Outbound Click: ${JSON.stringify(selectedCampaignMetrics?.cost_per_unique_outbound_click)}, 
  //       CTR: ${selectedCampaignMetrics?.ctr}, 
  //       CPP: ${selectedCampaignMetrics?.cpp}, 
  //       Objective: ${selectedCampaignMetrics?.objective}, 
  //       Social Spend: ${selectedCampaignMetrics?.social_spend}, 
  //       Quality Ranking: ${selectedCampaignMetrics?.quality_ranking}, 
  //       Reach: ${selectedCampaignMetrics?.reach}, 
  //       Frequency: ${selectedCampaignMetrics?.frequency}, 
  //       Start Date: ${selectedCampaignMetrics?.date_start}, 
  //       End Date: ${selectedCampaignMetrics?.date_stop}`
  //   };

  //   // const campaignMetricsMessage = {
  //   //   role: "assistant",
  //   //   content: `Campaign data: Clicks: ${selectedCampaignMetrics?.clicks}, Impressions: ${selectedCampaignMetrics?.impressions}, Spend: ${selectedCampaignMetrics?.spend}, CPC: ${selectedCampaignMetrics?.cpc}, CPM: ${selectedCampaignMetrics?.cpm}, Conversions: ${selectedCampaignMetrics?.conversions}, Cost per Conversion: ${selectedCampaignMetrics?.cost_per_conversion}.`, // Example of key metrics
  //   // };

  //   // Update the message history with campaign data and user input
  //   setMessages((prevMessages) => [
  //     ...prevMessages,
  //     campaignMetricsMessage,
  //     newMessage,
  //   ]);

  //   setIsLoading(true);

  //   // Send the chat history (including campaign data and user input) to the OpenAI API for response
  //   fetch("/api/conversation", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       conversationHistory: [
  //         ...messages,
  //         campaignMetricsMessage,  // Include campaign data as part of the history
  //         { role: "user", content: userInput },  // Add the new user message
  //       ],
  //     }),
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       if (data.error) {
  //         setError(data.error);
  //       } else {
  //         // Append OpenAI's response to the chat
  //         setMessages((prevMessages) => [
  //           ...prevMessages,
  //           { role: "assistant", content: data.response },
  //         ]);
  //       }
  //     })
  //     .catch((err) => {
  //       setError("Error fetching OpenAI response");
  //     })
  //     .finally(() => {
  //       setIsLoading(false);
  //       setUserInput("");  // Clear the input field after sending the message
  //     });
  // };


  return (
    <div style={{ padding: '30px', backgroundColor: '#f5f5f5' }}>
      {status === "loading" ? (
        <p>Loading...</p>
      ) : (
        <>
          <h1 style={{ fontSize: '30px', fontWeight: '700', marginBottom: '20px', color: '#5A9EC9' }}>Facebook Ad Accounts</h1>
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
          {/* Chat UI */}
          {selectedCampaignMetrics && (
            <div style={{ marginTop: '5px', padding: '20px', backgroundColor: '#fff', borderRadius: '10px' }}>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ color: 'black' }}><strong>Clicks:</strong> {selectedCampaignMetrics.clicks}</p>
                <p style={{ color: 'black' }}><strong>Impressions:</strong> {selectedCampaignMetrics.impressions}</p>
              </div>
              <h3 style={{ color: 'black' }}>Chat with OpenAI about this campaign</h3>
              <div style={{ marginBottom: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      backgroundColor: message.role === "user" ? "#f1f1f1" : "#ffffff", // Light grey for user, white for OpenAI
                      borderRadius: '8px',
                      color: 'black',
                      border: '1px solid #e0e0e0', // Light border for contrast
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Subtle shadow to make it stand out
                    }}
                  >
                    <strong style={{ color: '#7EC8E3' }}>
                      {message.role === "user" ? "You" : "OpenAI"}:
                    </strong>
                    <p>{message.content}</p>
                  </div>
                ))}
              </div>

              {/* <div style={{ marginBottom: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      backgroundColor: message.role === "user" ? "white" : "white",
                      borderRadius: '8px',
                      color : 'black'
                    }}
                  >
                    <strong style={{color: '#7EC8E3'}}>{message.role === "user" ? "You" : "OpenAI"}:</strong> {message.content}
                  </div>
                ))}
              </div> */}

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  style={{
                    width: '80%',
                    padding: '10px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    marginBottom: '10px',
                    minHeight: '80px',
                    // color: '#7EC8E3'
                    color: 'white'
                  }}
                  placeholder="Ask OpenAI about improving your campaign..."
                ></textarea>

                <button
                  onClick={handleSendMessage}
                  style={{
                    backgroundColor: '#3182ce',
                    color: 'white',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    marginLeft: '10px',
                  }}
                >
                  {isLoading ? "Loading..." : "Send"}
                </button>
              </div>
            </div>
          )}
          <div style={{ marginTop: '20px' }}>
            {loading ? (
              <p style={{ color: '#7EC8E3' }}>Loading ad accounts...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : (
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {adAccounts.map((account) => (
                  <li
                    key={account.id}
                    onClick={() => handleAccountClick(account.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '15px',
                      // backgroundColor: 'white',
                      marginBottom: '15px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: '900', color: 'black' }}>{account.name}</span>
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
            )}
          </div>

          {selectedAccount && campaigns.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'black' }}>Campaigns for {selectedAccount}</h2>
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {campaigns.map((campaign) => (
                  <li
                    key={campaign.id}
                    // onClick={() => campaign.status === 'ACTIVE' && handleCampaignClick(campaign)} // Only click for ACTIVE campaigns
                    onClick={() => handleCampaignClick(campaign)} // Only click for ACTIVE campaigns
                    style={{
                      padding: '12px',
                      marginBottom: '12px',
                      backgroundColor: campaign.status === 'ACTIVE' ? 'white' : 'white', // Active campaigns have white background, paused ones are greyed out
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      // cursor: campaign.status === 'ACTIVE' ? 'pointer' : 'not-allowed', // Set pointer for active, not-allowed for paused
                      cursor: campaign.status === 'ACTIVE' ? 'pointer' : 'pointer', // Set pointer for active, not-allowed for paused
                      opacity: campaign.status === 'PAUSED' ? 1 : 1, // Reduce opacity for paused campaigns
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'black' }}>{campaign.name}</span>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: campaign.status === 'ACTIVE' ? 'green' : 'red', // Green for active, red for paused
                        }}
                      >
                        {campaign.status} | {campaign.objective}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}


        </>
      )}
    </div>
  );
}
