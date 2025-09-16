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
  
  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

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
        
        // Open chatbot and create new chat session
        const newChatId = Date.now().toString();
        setCurrentChatId(newChatId);
        setMessages([{
          id: 1,
          type: 'bot',
          message: `Hello! I'm your Facebook Ads AI assistant. I can help you analyze your campaign "${data.campaign_name}" data, provide insights, and answer questions about your advertising performance. How can I help you today?`,
          timestamp: new Date()
        }]);
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

  // Chatbot functions
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setMessages([]);
    setCurrentChatId(null);
  };

  const startNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([{
      id: 1,
      type: 'bot',
      message: 'Hello! I\'m your Facebook Ads AI assistant. I can help you analyze your campaign data, provide insights, and answer questions about your advertising performance. How can I help you today?',
      timestamp: new Date()
    }]);
    setIsChatOpen(true);
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      type: 'user',
      message: userInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setUserInput("");
    setIsTyping(true);

    try {
      // TODO: Replace with actual API call to addrunner-chatbot-python
      // For now, simulate a response
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          type: 'bot',
          message: `I received your message: "${userInput}". This is a placeholder response. The actual integration with your Python chatbot API will be implemented next.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper function to safely render values
  const renderValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value;
  };

  // Helper function to format action arrays for better display
  const formatActionData = (data) => {
    if (!data) return 'N/A';
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) {
      if (data.length === 0) return 'No data';
      return data.map(item => {
        if (item.action_type && item.value) {
          // Clean up action type names for better readability
          const cleanActionType = item.action_type
            .replace('offsite_conversion.fb_pixel_custom', 'Custom Conversion')
            .replace('omni_landing_page_view', 'Landing Page View')
            .replace('post_engagement', 'Post Engagement')
            .replace('page_engagement', 'Page Engagement')
            .replace('landing_page_view', 'Landing Page View')
            .replace('video_view', 'Video View')
            .replace('link_click', 'Link Click')
            .replace('outbound_click', 'Outbound Click');
          
          return `${cleanActionType}: ${item.value}`;
        }
        return JSON.stringify(item);
      }).join(' | ');
    }
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    return data;
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

  // ChatGPT-style Components
  const ChatMessage = ({ message }) => {
    const isUser = message.type === 'user';

    return (
      <div style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '20px',
        padding: '0 20px'
      }}>
        <div style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: isUser ? '#007bff' : '#f1f3f4',
            color: isUser ? 'white' : '#333',
            borderRadius: '12px',
            fontSize: '14px',
            lineHeight: '1.5',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}>
            {message.message}
          </div>
          <div style={{
            fontSize: '11px',
            color: '#666',
            marginTop: '4px',
            padding: '0 4px'
          }}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  const TypingIndicator = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '20px',
      padding: '0 20px'
    }}>
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f1f3f4',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#666',
            borderRadius: '50%',
            animation: 'typing 1.4s infinite ease-in-out'
          }}></div>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#666',
            borderRadius: '50%',
            animation: 'typing 1.4s infinite ease-in-out 0.2s'
          }}></div>
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#666',
            borderRadius: '50%',
            animation: 'typing 1.4s infinite ease-in-out 0.4s'
          }}></div>
        </div>
        <span style={{ fontSize: '14px', color: '#666' }}>AI is thinking...</span>
      </div>
    </div>
  );

  const ChatHistorySidebar = () => (
    <div style={{
      width: '260px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
          Chat History
        </h3>
        <button
          onClick={startNewChat}
          style={{
            background: 'none',
            border: '1px solid #007bff',
            color: '#007bff',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          + New Chat
        </button>
      </div>

      {/* Chat History List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 0'
      }}>
        {chatHistory.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            No chat history yet
          </div>
        ) : (
          chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: currentChatId === chat.id ? '#e3f2fd' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {chat.title}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#666'
              }}>
                {chat.timestamp.toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ChatbotInterface = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header */}
      <div style={{
        height: '60px',
        backgroundColor: '#007bff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid #0056b3'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🤖
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Facebook Ads AI Assistant
            </h2>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {selectedCampaignMetrics ? `Analyzing: ${selectedCampaignMetrics.campaign_name}` : 'Ready to help'}
            </div>
          </div>
        </div>
        <button
          onClick={closeChat}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Main Chat Area */}
      <div style={{ display: 'flex', flex: 1, height: 'calc(100vh - 60px)' }}>
        {/* Sidebar */}
        <ChatHistorySidebar />

        {/* Chat Messages */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 0',
            backgroundColor: '#fafafa'
          }}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>

          {/* Input Area */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            borderTop: '1px solid #e0e0e0'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-end',
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about your campaign data..."
                  style={{
                    width: '100%',
                    minHeight: '44px',
                    maxHeight: '120px',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '22px',
                    fontSize: '14px',
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.4',
                    backgroundColor: '#f8f9fa'
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!userInput.trim() || isTyping}
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: userInput.trim() && !isTyping ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: userInput.trim() && !isTyping ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s ease'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '30px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {status === "loading" ? (
        <LoadingSpinner size="large" text="Authenticating..." />
      ) : isChatOpen ? (
        <ChatbotInterface />
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
                        {renderValue(selectedCampaignMetrics.clicks)}
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
                        {renderValue(selectedCampaignMetrics.impressions)?.toLocaleString()}
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
                        ${renderValue(selectedCampaignMetrics.spend)}
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
                        {renderValue(selectedCampaignMetrics.ctr)}%
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
                        <strong style={{ color: '#495057' }}>CPC:</strong> <span style={{ color: '#495057' }}>${renderValue(selectedCampaignMetrics.cpc)}</span>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>CPM:</strong> <span style={{ color: '#495057' }}>${renderValue(selectedCampaignMetrics.cpm)}</span>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>Reach:</strong> <span style={{ color: '#495057' }}>{selectedCampaignMetrics.reach?.toLocaleString()}</span>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>Frequency:</strong> <span style={{ color: '#495057' }}>{selectedCampaignMetrics.frequency}</span>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>CPP:</strong> <span style={{ color: '#495057' }}>${renderValue(selectedCampaignMetrics.cpp)}</span>
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                        <strong style={{ color: '#495057' }}>Social Spend:</strong> <span style={{ color: '#495057' }}>${renderValue(selectedCampaignMetrics.social_spend)}</span>
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
                            <strong style={{ color: '#155724' }}>Conversions:</strong> <span style={{ color: '#155724' }}>{formatActionData(selectedCampaignMetrics.conversions)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.website_purchase_roas && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>ROAS:</strong> <span style={{ color: '#155724' }}>{renderValue(selectedCampaignMetrics.website_purchase_roas)}x</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.cost_per_conversion && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>Cost per Conversion:</strong> <span style={{ color: '#155724' }}>{formatActionData(selectedCampaignMetrics.cost_per_conversion)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.cost_per_purchase && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>Cost per Purchase:</strong> <span style={{ color: '#155724' }}>{renderValue(selectedCampaignMetrics.cost_per_purchase)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.conversion_values && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>Conversion Values:</strong> <span style={{ color: '#155724' }}>{formatActionData(selectedCampaignMetrics.conversion_values)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.cost_per_action_type && (
                          <div style={{ padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                            <strong style={{ color: '#155724' }}>Cost per Action Type:</strong> <span style={{ color: '#155724' }}>{formatActionData(selectedCampaignMetrics.cost_per_action_type)}</span>
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
                            <strong style={{ color: '#856404' }}>Actions:</strong> <span style={{ color: '#856404' }}>{formatActionData(selectedCampaignMetrics.actions)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.action_values && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Action Values:</strong> <span style={{ color: '#856404' }}>{formatActionData(selectedCampaignMetrics.action_values)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.post_reactions && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Post Reactions:</strong> <span style={{ color: '#856404' }}>{renderValue(selectedCampaignMetrics.post_reactions)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.post_comments && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Post Comments:</strong> <span style={{ color: '#856404' }}>{renderValue(selectedCampaignMetrics.post_comments)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.post_shares && (
                          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                            <strong style={{ color: '#856404' }}>Post Shares:</strong> <span style={{ color: '#856404' }}>{renderValue(selectedCampaignMetrics.post_shares)}</span>
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
                            <strong style={{ color: '#0c5460' }}>Outbound Clicks:</strong> <span style={{ color: '#0c5460' }}>{formatActionData(selectedCampaignMetrics.outbound_clicks)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_clicks && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique Clicks:</strong> <span style={{ color: '#0c5460' }}>{renderValue(selectedCampaignMetrics.unique_clicks)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.outbound_clicks_ctr && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Outbound CTR:</strong> <span style={{ color: '#0c5460' }}>{formatActionData(selectedCampaignMetrics.outbound_clicks_ctr)}%</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_ctr && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique CTR:</strong> <span style={{ color: '#0c5460' }}>{renderValue(selectedCampaignMetrics.unique_ctr)}%</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_outbound_clicks && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique Outbound Clicks:</strong> <span style={{ color: '#0c5460' }}>{formatActionData(selectedCampaignMetrics.unique_outbound_clicks)}</span>
                          </div>
                        )}
                        {selectedCampaignMetrics.unique_outbound_clicks_ctr && (
                          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', borderLeft: '4px solid #17a2b8' }}>
                            <strong style={{ color: '#0c5460' }}>Unique Outbound CTR:</strong> <span style={{ color: '#0c5460' }}>{formatActionData(selectedCampaignMetrics.unique_outbound_clicks_ctr)}%</span>
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
                      <strong style={{ color: '#0d47a1' }}>Start:</strong> <span style={{ color: '#0d47a1' }}>{selectedCampaignMetrics.date_start}</span><br/>
                      <strong style={{ color: '#0d47a1' }}>End:</strong> <span style={{ color: '#0d47a1' }}>{selectedCampaignMetrics.date_stop}</span>
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
            <div style={{ marginBottom: '30px', position: 'relative' }}>
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
                      <LoadingSpinner size="large" text="Loading campaign data..." />
                    </div>
                  )}
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
                        cursor: loading.campaignDetails ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease-in-out',
                        border: '1px solid #e9ecef',
                        opacity: campaign.status === 'PAUSED' ? 0.7 : loading.campaignDetails ? 0.5 : 1,
                        position: 'relative'
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