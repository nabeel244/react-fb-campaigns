'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// Configuration - Change this URL as needed
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const NewChatComponent = ({ 
  isOpen, 
  onClose, 
  campaignData, 
  messages, 
  setMessages, 
  isTyping, 
  setIsTyping, 
  currentChatId, 
  setCurrentChatId, 
  chatHistory, 
  setChatHistory, 
  hasLoadedConversations, 
  setHasLoadedConversations 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const inputRef = useRef(null);

  // Debug: Log messages when they change
  useEffect(() => {
    console.log('NewChatComponent - Messages updated:', messages);
    console.log('NewChatComponent - hasLoadedConversations:', hasLoadedConversations);
  }, [messages, hasLoadedConversations]);

  // Initialize with welcome message when component mounts (only if no conversations loaded)
  useEffect(() => {
    console.log('NewChatComponent useEffect - messages.length:', messages.length, 'hasLoadedConversations:', hasLoadedConversations);
    if (messages.length === 0 && !hasLoadedConversations) {
      console.log('Setting default welcome message');
      setMessages([{
        id: 1,
        type: 'bot',
        message: campaignData 
          ? `Hello! I'm your Facebook Ads AI assistant. I'm ready to analyze your campaign: **${campaignData.campaign_name}**. How can I help you today?`
          : 'Hello! I\'m your Facebook Ads AI assistant. I can help you analyze your campaign data, provide insights, and answer questions about your advertising performance. How can I help you today?',
        timestamp: new Date(),
        isStreaming: false
      }]);
    } else if (messages.length === 0 && hasLoadedConversations) {
      console.log('Conversations were loaded but no messages found - this might be an error');
    } else {
      console.log('Skipping default message - messages exist or conversations loaded');
    }
  }, [campaignData, hasLoadedConversations]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch campaigns when component opens
  useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
    }
  }, [isOpen]);

  // Function to fetch campaigns from API
  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      console.log('📋 Fetching campaigns from API...');
      
      // Get stored auth data for authorization
      const authData = getStoredAuthData();
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token is available and valid
      if (authData && isTokenValid(authData)) {
        headers['Authorization'] = `Bearer ${authData.access_token}`;
        console.log('🔐 Using stored auth token for campaigns API');
      } else {
        console.warn('⚠️ No valid auth token found for campaigns API');
      }

      // Call the campaigns API
      const campaignsResponse = await fetch(`${API_BASE_URL}/api/data/campaigns`, {
        method: 'GET',
        headers: headers
      });

      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
        console.log('✅ Campaigns fetched successfully:', campaignsData);
      } else {
        console.error('❌ Failed to fetch campaigns:', campaignsResponse.statusText);
      }
    } catch (error) {
      console.error('❌ Error fetching campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Function to handle campaign selection from sidebar
  const handleCampaignSelect = async (campaign) => {
    try {
      console.log('🎯 Campaign selected from sidebar:', campaign);
      
      // Set the selected campaign locally
      setSelectedCampaign(campaign);
      
      // Reset conversation state
      setHasLoadedConversations(false);
      setMessages([]);
      
      // Get stored auth data for authorization
      const authData = getStoredAuthData();
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token is available and valid
      if (authData && isTokenValid(authData)) {
        headers['Authorization'] = `Bearer ${authData.access_token}`;
        console.log('🔐 Using stored auth token for campaign load');
      } else {
        console.warn('⚠️ No valid auth token found for campaign load');
      }

      // Call load API
      console.log(`🔄 Loading campaign ${campaign.id} for analysis...`);
      const loadResponse = await fetch(`${API_BASE_URL}/api/data/campaigns/${campaign.id}/load`, {
        method: 'POST',
        headers: headers
      });

      if (loadResponse.ok) {
        const loadData = await loadResponse.json();
        console.log('Campaign loaded successfully:', loadData);
        
        // Check if ready for chat
        if (loadData.ready_for_chat) {
          console.log(`✅ Campaign ready for chat, fetching conversations...`);
          
          // Call conversations API
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
          console.log('Campaign not ready for chat yet');
        }
      } else if (loadResponse.status === 500) {
        const errorData = await loadResponse.json();
        if (errorData.detail && errorData.detail.includes("Campaign not found")) {
          console.log('Campaign not found in load API, continuing with fresh chat');
        } else {
          console.error('Error loading campaign:', errorData);
        }
      } else {
        console.error('Failed to load campaign:', loadResponse.statusText);
      }
    } catch (error) {
      console.error('Error loading campaign from sidebar:', error);
    }
  };

  // Convert inline tables to HTML like Python chatbot
  const convertInlineTablesDirectly = (content) => {
    try {
      // Only log once per conversion to reduce console spam
      if (Math.random() < 0.1) { // Only log 10% of the time
      console.log('Converting inline tables directly to HTML...');
      }
      
      let result = content;
      
      // Pattern 1: Platform Breakdown tables
      result = result.replace(/(Platform Breakdown.*?)(?=\n\s*[A-Z]|\n\n|$)/gs, (match) => {
        return generateHTMLTable(match, 'Platform Breakdown', ['Platform', 'Spend', 'Clicks', 'Impressions', 'CTR', 'CPC']);
      });
      
      // Pattern 2: Cost Per Action Types
      result = result.replace(/(Cost Per Action Types.*?)(?=\n\s*[A-Z]|\n\n|$)/gs, (match) => {
        return generateHTMLTable(match, 'Cost Per Action Types', ['Action Type', 'Cost']);
      });
      
      // Pattern 3: Daily Insights
      result = result.replace(/(Daily Insights.*?)(?=\n\s*[A-Z]|\n\n|$)/gs, (match) => {
        return generateHTMLTable(match, 'Daily Insights', ['Date', 'Impressions', 'Clicks', 'Spend', 'Actions']);
      });
      
      // Pattern 4: Actions Overall
      result = result.replace(/(Actions Overall.*?)(?=\n\s*[A-Z]|\n\n|$)/gs, (match) => {
        return generateHTMLTable(match, 'Actions Overall', ['Action Type', 'Count']);
      });
      
      // Pattern 5: Demographics
      result = result.replace(/(Demographics.*?)(?=\n\s*[A-Z]|\n\n|$)/gs, (match) => {
        return generateHTMLTable(match, 'Demographics', ['Segment', 'Impressions', 'Clicks', 'Spend']);
      });
      
      return result;
    } catch (error) {
      console.error('Error converting inline tables directly:', error);
      return content;
    }
  };

  // Generate HTML table from text data
  const generateHTMLTable = (tableText, title, expectedHeaders) => {
    try {
      // Only log once per table generation to reduce console spam
      if (Math.random() < 0.1) { // Only log 10% of the time
      console.log(`Generating HTML table for: ${title}`);
      }
      
      let parts = tableText.split('|').map(p => p.trim()).filter(p => p !== '' && p !== title);
      
      if (parts.length < expectedHeaders.length * 2) {
        return tableText; // Not enough data
      }
      
      // Build HTML with simple title
      let html = `<h3 style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 1em 0 0.5em 0; padding: 8px 0; border-bottom: 2px solid #3b82f6;">📊 ${title}</h3>\n`;
      html += `<div style="overflow-x: auto; margin: 1em 0; border: 1px solid #e2e8f0; border-radius: 8px;">\n`;
      html += `<table style="border-collapse: collapse; width: 100%; min-width: 600px; background: white; font-size: 0.9rem;">\n`;
      
      // Header row with simple styling
      html += '<thead><tr>';
      for (let header of expectedHeaders) {
        html += `<th style="
          background: #f8fafc;
          color: #1e40af;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1px solid #e2e8f0;
          padding: 12px 16px;
          text-align: left;
          vertical-align: middle;
        ">${header}</th>`;
      }
      html += '</tr></thead>\n<tbody>\n';
      
      // Data rows with simple styling
      let currentRow = [];
      for (let part of parts) {
        // Skip parts that look like headers
        if (expectedHeaders.some(h => part.toLowerCase().includes(h.toLowerCase()))) {
          continue;
        }
        
        currentRow.push(part);
        
        if (currentRow.length === expectedHeaders.length) {
          html += '<tr>';
          for (let i = 0; i < currentRow.length; i++) {
            const cell = currentRow[i];
            const isFirstColumn = i === 0;
            
            html += `<td style="
              border: 1px solid #e2e8f0;
              padding: 12px 16px;
              text-align: left;
              vertical-align: middle;
              background: white;
              font-weight: ${isFirstColumn ? '600' : '400'};
              color: ${isFirstColumn ? '#1e40af' : '#374151'};
            ">${cell}</td>`;
          }
          html += '</tr>\n';
          currentRow = [];
        }
      }
      
      html += '</tbody>\n</table>\n</div>\n\n';
      
      return html;
      
    } catch (error) {
      console.error('Error generating HTML table:', error);
      return tableText;
    }
  };

  // Clean and format streaming text with flat structure
  const cleanStreamingText = (text) => {
    if (!text) return '';
    
    // Step 1: Convert inline tables to HTML (only if text contains table patterns and is substantial)
    let processedContent = text;
    if (text.length > 100 && (text.includes('Platform Breakdown') || text.includes('Daily Insights') || text.includes('Demographics'))) {
      processedContent = convertInlineTablesDirectly(text);
    }
    
    // Step 2: Simple text cleaning and formatting
    let cleaned = processedContent
      // Remove duplicate patterns
      .replace(/(HereHere is the complete|Here is the complete|Here is your complete campaign data:)/g, '')
      .replace(/(Campaign Overview|Campaign: \*\*\*|Campaign: \*\*\*\*)/g, '')
      .replace(/\*\*\*\*/g, '') // Remove asterisks
      .replace(/\*\*\*/g, '') // Remove triple asterisks
      .replace(/\*\*/g, '') // Remove double asterisks
      
      // Highlight section titles only
      .replace(/Campaign Overview/g, '<h2 style="color: #1e40af; font-size: 18px; font-weight: 600; margin: 1em 0 0.5em 0; padding: 8px 0; border-bottom: 2px solid #3b82f6;">📊 Campaign Overview</h2>')
      .replace(/Platform Breakdown/g, '<h3 style="color: #7c3aed; font-size: 16px; font-weight: 600; margin: 1em 0 0.5em 0; padding: 6px 0; border-bottom: 1px solid #a855f7;">🌐 Platform Breakdown</h3>')
      .replace(/Cost Per Action Types/g, '<h3 style="color: #dc2626; font-size: 16px; font-weight: 600; margin: 1em 0 0.5em 0; padding: 6px 0; border-bottom: 1px solid #ef4444;">💰 Cost Per Action Types</h3>')
      .replace(/Daily Insights/g, '<h3 style="color: #ea580c; font-size: 16px; font-weight: 600; margin: 1em 0 0.5em 0; padding: 6px 0; border-bottom: 1px solid #f97316;">📅 Daily Insights</h3>')
      .replace(/Actions Overall/g, '<h3 style="color: #0891b2; font-size: 16px; font-weight: 600; margin: 1em 0 0.5em 0; padding: 6px 0; border-bottom: 1px solid #06b6d4;">📈 Actions Overall</h3>')
      .replace(/Demographics/g, '<h3 style="color: #be185d; font-size: 16px; font-weight: 600; margin: 1em 0 0.5em 0; padding: 6px 0; border-bottom: 1px solid #ec4899;">👥 Demographics</h3>')
      
      // Simple bullet points - one line each, no indentation
      .replace(/([^-\n])-\s+/g, '$1\n<div style="margin: 2px 0; padding: 4px 0;"><span style="color: #3b82f6; font-weight: 600;">•</span> ')
      .replace(/\n- /g, '\n<div style="margin: 2px 0; padding: 4px 0;"><span style="color: #3b82f6; font-weight: 600;">•</span> ')
      
      // Add line breaks for numbered lists
      .replace(/(\d+\.)\s+/g, '\n$1 ')
      
      // Clean up extra spaces and normalize line breaks
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '') // Remove leading newlines
      .trim();
    
    return cleaned;
  };

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

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Add initial bot message for streaming
    const botMessageId = Date.now() + 1;
    const initialBotMessage = {
      id: botMessageId,
      type: 'bot',
      message: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, initialBotMessage]);

    try {
      // Get stored auth data for user ID and token
      const authData = getStoredAuthData();
      
      // Call Python chatbot streaming API
      const chatPayload = {
        message: inputValue.trim(),
        prompt_type: "executive",
        timestamp: new Date().toISOString(),
        campaign_id: campaignData?.campaign_id || null
      };
      
      console.log('💬 Chat payload - campaign_id:', campaignData?.campaign_id, 'campaignData:', campaignData);

      console.log('Sending message to Python streaming API:', chatPayload);

      const headers = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token is available and valid
      if (authData && isTokenValid(authData)) {
        headers['Authorization'] = `Bearer ${authData.access_token}`;
        console.log('🔐 Using stored auth token for chat streaming');
      } else {
        console.warn('⚠️ No valid auth token found for chat streaming');
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chatPayload)
      });

      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          message: '',
          timestamp: new Date(),
          isStreaming: true
        };

        setMessages(prev => [...prev, botMessage]);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonString = line.slice(6).trim();
                  
                  if (!jsonString || jsonString === '') continue;
                  
                  const data = JSON.parse(jsonString);
                  
                  if (data.text) {
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === botMessage.id 
                          ? { ...msg, message: data.text }
                          : msg
                      )
                    );
                  }
                  
                  if (data.done) {
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === botMessage.id 
                          ? { ...msg, isStreaming: false }
                          : msg
                      )
                    );
                    break;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (error) {
      console.error('Error sending message to Python API:', error);
      const errorResponse = {
        id: botMessageId,
        type: 'bot',
        message: 'Sorry, I encountered an error. Please check if the Python API is running and try again.',
        timestamp: new Date(),
        isStreaming: false
      };
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMessageId ? errorResponse : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    try {
      console.log('🗑️ Clearing chat and calling clear API...');
      
      // Get stored auth data for authorization
      const authData = getStoredAuthData();
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if token is available and valid
      if (authData && isTokenValid(authData)) {
        headers['Authorization'] = `Bearer ${authData.access_token}`;
        console.log('🔐 Using stored auth token for clear API');
      } else {
        console.warn('⚠️ No valid auth token found for clear API');
      }

      // Call the clear API
      const clearResponse = await fetch(`${API_BASE_URL}/api/data/clear`, {
        method: 'DELETE',
        headers: headers
      });

      if (clearResponse.ok) {
        const clearData = await clearResponse.json();
        console.log('✅ Chat cleared successfully:', clearData);
      } else {
        console.error('❌ Failed to clear chat:', clearResponse.statusText);
      }
    } catch (error) {
      console.error('❌ Error calling clear API:', error);
    } finally {
      // Always clear the local messages regardless of API success/failure
      setMessages([]);
    }
  };

  const startNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([{
      id: 1,
      type: 'bot',
      message: 'Hello! I\'m your Facebook Ads AI assistant. I can help you analyze your campaign data, provide insights, and answer questions about your advertising performance. How can I help you today?',
      timestamp: new Date(),
      isStreaming: false
    }]);
  };

  const CampaignsSidebar = () => (
    <div style={{
      width: '280px',
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
          📊 Campaigns
        </h3>
        <button
          onClick={fetchCampaigns}
          disabled={loadingCampaigns}
          style={{
            background: 'none',
            border: '1px solid #007bff',
            color: '#007bff',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: loadingCampaigns ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            opacity: loadingCampaigns ? 0.6 : 1
          }}
        >
          {loadingCampaigns ? '⏳' : '🔄'}
        </button>
      </div>

      {/* Campaigns List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 0'
      }}>
        {loadingCampaigns ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e0e0e0',
              borderTop: '2px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px'
            }}></div>
            Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            No campaigns found
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => handleCampaignSelect(campaign)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: selectedCampaign?.id === campaign.id ? '#e3f2fd' : 'transparent',
                transition: 'background-color 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Status indicator */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: campaign.status === 'active' ? '#28a745' : '#dc3545'
              }}></div>
              
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '20px'
              }}>
                {campaign.campaign_name}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginBottom: '4px'
              }}>
                ID: {campaign.id}
              </div>
              
              {campaign.basic_metrics && (
                <div style={{
                  fontSize: '11px',
                  color: '#888',
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '4px'
                }}>
                  <span>Spend: ${campaign.basic_metrics.spend?.toFixed(2) || '0'}</span>
                  <span>Clicks: {campaign.basic_metrics.clicks || '0'}</span>
                </div>
              )}
              
              <div style={{
                fontSize: '11px',
                color: '#888',
                marginTop: '2px'
              }}>
                {new Date(campaign.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header - Same as your original design */}
      <div style={{
        height: '70px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        color: '#1f2937',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}>
            🤖
          </div>
          <div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '22px', 
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px'
            }}>
              Facebook Ads AI Assistant
            </h2>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      fontWeight: '500',
                      marginTop: '2px'
                    }}>
                      {selectedCampaign?.campaign_name || campaignData?.campaign_name ? 
                        `Analyzing: ${selectedCampaign?.campaign_name || campaignData?.campaign_name}` : 
                        'Select a campaign to start'}
                    </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={clearChat}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              fontSize: '14px',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Clear Chat
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              fontSize: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        height: 'calc(100vh - 70px)',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)'
      }}>
                {/* Sidebar */}
                <CampaignsSidebar />

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
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '20px'
          }}>
          {/* Messages Container */}
          <div style={{ 
            flex: 1, 
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            overflowY: 'auto'
          }}>
            {messages.length === 0 && (
              <div style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '16px',
                marginTop: '50px'
              }}>
                Ask me about your campaign data!
              </div>
            )}
            
            {messages.map((message) => {
              const isUser = message.type === 'user';
              const decodedText = message.message.replace(/\\u[\dA-F]{4}/gi, match =>
                String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
              );
              
              // Clean the text for better formatting
              const cleanedText = cleanStreamingText(decodedText);
              
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    marginBottom: '24px',
                    padding: '0 10px'
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      padding: '16px 20px',
                      background: isUser 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                        : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      color: isUser ? 'white' : '#1f2937',
                      borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      boxShadow: isUser 
                        ? '0 4px 15px rgba(102, 126, 234, 0.3)' 
                        : '0 4px 15px rgba(0, 0, 0, 0.1)',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      fontWeight: '500'
                    }}>
                      {isUser ? (
                        decodedText // Display raw text for user
                      ) : (
                        <div>
                          <div
                            dangerouslySetInnerHTML={{ __html: cleanedText }}
                          />
                          {message.isStreaming && (
                            <span style={{
                              display: 'inline-block',
                              width: '2px',
                              height: '1em',
                              background: '#1877f2',
                              animation: 'blink 1s infinite',
                              marginLeft: '2px'
                            }}></span>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'white',
                      marginTop: '6px',
                      padding: '0 8px',
                      fontWeight: '500'
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                marginBottom: '24px',
                padding: '0 10px'
              }}>
                <div style={{
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '20px 20px 20px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite ease-in-out'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite ease-in-out 0.2s'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '50%',
                      animation: 'typing 1.4s infinite ease-in-out 0.4s'
                    }}></div>
                  </div>
                  <span style={{ 
                    fontSize: '15px', 
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>AI is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-end',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me about your campaign data..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={isTyping}
                  style={{
                    width: '100%',
                    height: '52px',
                    padding: '16px 20px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '26px',
                    fontSize: '15px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '26px',
                  border: 'none',
                  cursor: !inputValue.trim() || isTyping ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: '600',
                  background: !inputValue.trim() || isTyping ? '#d1d5db' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  boxShadow: !inputValue.trim() || isTyping ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 4px 15px rgba(59, 130, 246, 0.3)',
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
    </div>
    </>
  );
};

export default NewChatComponent;
