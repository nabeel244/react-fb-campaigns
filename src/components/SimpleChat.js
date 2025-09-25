'use client';

import { useState, useRef, useEffect } from 'react';

const SimpleChat = ({ isOpen, onClose, campaignData }) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isStreamingRef = useRef(false);

  // Simple scroll function - only use when absolutely necessary
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Focus input when chat opens and scroll to show existing messages
  useEffect(() => {
    if (isOpen) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
      // Scroll to show existing messages when chat opens
      setTimeout(() => scrollToBottom(), 200);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    // Scroll to bottom when user sends message
    setTimeout(() => scrollToBottom(), 100);

    try {
      const response = await fetch('http://localhost:8000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
          user_id: "anonymous",
          timestamp: new Date().toISOString()
        })
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
        isStreamingRef.current = true;
        
        // Don't scroll during streaming - only at the end

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
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
                    isStreamingRef.current = false;
                    // Scroll to bottom when streaming is complete - wait for all updates to finish
                    setTimeout(() => scrollToBottom(), 500);
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
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
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

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '600px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid #e5e7eb'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          AI Assistant
        </h3>
        <div>
          <button
            onClick={clearChat}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '4px',
              marginRight: '8px',
              borderRadius: '4px'
            }}
            title="Clear chat"
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Container - This is where the built-in scroll works */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
            marginTop: '20px'
          }}>
            Ask me about your campaign data!
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '8px'
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: message.type === 'user' ? '#3b82f6' : '#f3f4f6',
                color: message.type === 'user' ? 'white' : '#111827',
                fontSize: '14px',
                lineHeight: '1.4',
                wordWrap: 'break-word'
              }}
            >
              {message.message}
              {message.isStreaming && (
                <span style={{ opacity: 0.7 }}>▋</span>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '8px'
          }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Typing...
            </div>
          </div>
        )}
        
        {/* This div is what makes the auto-scroll work */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isTyping}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '24px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            style={{
              padding: '12px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: (!input.trim() || isTyping) ? 0.5 : 1
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleChat;
