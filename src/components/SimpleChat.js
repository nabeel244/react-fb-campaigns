'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

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
                  const jsonString = line.slice(6).trim();
                  
                  // Skip empty lines or malformed JSON
                  if (!jsonString || jsonString === '') {
                    continue;
                  }
                  
                  // Check if JSON string is complete (basic validation)
                  if (!jsonString.endsWith('}') && !jsonString.endsWith(']')) {
                    console.warn('Incomplete JSON received, skipping:', jsonString);
                    continue;
                  }
                  
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
                    isStreamingRef.current = false;
                    // Scroll to bottom when streaming is complete - wait for all updates to finish
                    setTimeout(() => scrollToBottom(), 500);
                    break;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                  console.error('Problematic JSON string:', line.slice(6));
                  
                  // If JSON parsing fails, try to extract text manually
                  const jsonString = line.slice(6).trim();
                  if (jsonString.includes('"text"')) {
                    try {
                      // Try to extract text content manually
                      const textMatch = jsonString.match(/"text":\s*"([^"]*)/);
                      if (textMatch && textMatch[1]) {
                        const extractedText = textMatch[1];
                        setMessages(prev => 
                          prev.map(msg => 
                            msg.id === botMessage.id 
                              ? { ...msg, message: msg.message + extractedText }
                              : msg
                          )
                        );
                      }
                    } catch (extractError) {
                      console.error('Failed to extract text manually:', extractError);
                    }
                  }
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Handle non-OK responses
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          type: 'bot',
          message: `Sorry, I encountered an error (${response.status}). Please try again.`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if it's a JSON parsing error
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          type: 'bot',
          message: 'Sorry, I received malformed data from the server. Please try again.',
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          type: 'bot',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsTyping(false);
      isStreamingRef.current = false;
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
    <>
      {/* Add highlight.js CSS for syntax highlighting */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css"
      />
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
              {message.type === 'user' ? (
                message.message
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    // Enhanced styling for markdown elements
                    table: ({ children }) => (
                      <div style={{ 
                        overflowX: 'auto', 
                        margin: '12px 0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e2e8f0'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse',
                          fontSize: '13px',
                          backgroundColor: 'white'
                        }}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th style={{ 
                        backgroundColor: '#3b82f6', 
                        color: 'white',
                        padding: '12px 16px', 
                        textAlign: 'left',
                        fontWeight: '700',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '13px',
                        backgroundColor: '#fafbfc'
                      }}>
                        {children}
                      </td>
                    ),
                    h1: ({ children }) => (
                      <h1 style={{ 
                        fontSize: '18px', 
                        fontWeight: '800', 
                        margin: '16px 0 8px 0', 
                        color: '#1e40af',
                        borderBottom: '3px solid #3b82f6',
                        paddingBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 style={{ 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        margin: '14px 0 6px 0', 
                        color: '#1e40af',
                        borderLeft: '4px solid #3b82f6',
                        paddingLeft: '12px',
                        backgroundColor: '#f0f9ff',
                        padding: '8px 12px',
                        borderRadius: '4px'
                      }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        margin: '12px 0 6px 0', 
                        color: '#1e40af',
                        backgroundColor: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        margin: '10px 0 4px 0', 
                        color: '#374151',
                        textDecoration: 'underline',
                        textDecorationColor: '#3b82f6',
                        textUnderlineOffset: '3px'
                      }}>
                        {children}
                      </h4>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code style={{ 
                          backgroundColor: '#1f2937', 
                          color: '#f9fafb',
                          padding: '3px 6px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'Monaco, Consolas, monospace',
                          fontWeight: '500',
                          border: '1px solid #374151'
                        }}>
                          {children}
                        </code>
                      ) : (
                        <code className={className}>{children}</code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre style={{ 
                        backgroundColor: '#1f2937', 
                        color: '#f9fafb',
                        padding: '16px', 
                        borderRadius: '8px',
                        overflow: 'auto',
                        fontSize: '13px',
                        margin: '12px 0',
                        border: '1px solid #374151',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        fontFamily: 'Monaco, Consolas, monospace'
                      }}>
                        {children}
                      </pre>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ 
                        margin: '8px 0', 
                        paddingLeft: '20px',
                        listStyleType: 'disc'
                      }}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ 
                        margin: '8px 0', 
                        paddingLeft: '20px',
                        listStyleType: 'decimal'
                      }}>
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li style={{ 
                        margin: '6px 0', 
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#374151'
                      }}>
                        {children}
                      </li>
                    ),
                    p: ({ children }) => (
                      <p style={{ 
                        margin: '8px 0', 
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#374151'
                      }}>
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ 
                        fontWeight: '700', 
                        color: '#1f2937',
                        backgroundColor: '#fef3c7',
                        padding: '2px 4px',
                        borderRadius: '3px'
                      }}>
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em style={{ 
                        fontStyle: 'italic', 
                        color: '#6b7280',
                        backgroundColor: '#f3f4f6',
                        padding: '1px 3px',
                        borderRadius: '2px'
                      }}>
                        {children}
                      </em>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote style={{
                        borderLeft: '4px solid #3b82f6',
                        backgroundColor: '#f0f9ff',
                        padding: '12px 16px',
                        margin: '12px 0',
                        borderRadius: '0 6px 6px 0',
                        fontStyle: 'italic',
                        color: '#1e40af'
                      }}>
                        {children}
                      </blockquote>
                    ),
                    hr: () => (
                      <hr style={{
                        border: 'none',
                        height: '2px',
                        background: 'linear-gradient(to right, #3b82f6, #8b5cf6, #3b82f6)',
                        margin: '16px 0',
                        borderRadius: '1px'
                      }} />
                    ),
                    a: ({ children, href }) => (
                      <a 
                        href={href} 
                        style={{
                          color: '#3b82f6',
                          textDecoration: 'underline',
                          fontWeight: '600',
                          textDecorationColor: '#3b82f6',
                          textUnderlineOffset: '2px'
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    )
                  }}
                >
                  {message.message}
                </ReactMarkdown>
              )}
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
    </>
  );
};

export default SimpleChat;
