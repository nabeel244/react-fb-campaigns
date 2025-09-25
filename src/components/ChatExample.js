'use client';

import { useState } from 'react';
import SimpleChat from './SimpleChat';

const ChatExample = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [campaignData, setCampaignData] = useState(null);

  return (
    <div>
      {/* Your existing content goes here */}
      <h1>Your Facebook Ads Dashboard</h1>
      <p>Your existing content...</p>

      {/* Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          zIndex: 1000
        }}
      >
        💬
      </button>

      {/* Simple Chat Component - Just drop this in anywhere */}
      <SimpleChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        campaignData={campaignData}
      />
    </div>
  );
};

export default ChatExample;
