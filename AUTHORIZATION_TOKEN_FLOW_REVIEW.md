# Authorization Token Flow Review - Facebook Dev Branch

This document reviews how authorization tokens are passed to Python backend APIs in the `facebook-dev` branch.

## Overview

The application uses a **Bearer token authentication pattern** where:
1. After Facebook login, a token is obtained from the Python backend
2. The token is stored in `localStorage` with expiration tracking
3. The token is validated before each API call
4. Valid tokens are passed as `Authorization: Bearer <token>` header to all Python backend APIs

---

## 1. Token Storage (After Login)

### Location: `src/app/page.js` - `callFacebookLoginAPI` function

**Flow:**
1. User logs in with Facebook via NextAuth
2. NextAuth provides `accessToken` in session
3. Frontend calls Python backend login API: `POST /api/auth/facebook/login`
4. Backend returns authentication data including `access_token`
5. Frontend stores the response in `localStorage` with key `'userAuth'`

**Code:**
```javascript
// After successful Python API login response
localStorage.setItem('userAuth', JSON.stringify({
  user: data.user,
  access_token: data.access_token,        // ← This is the Bearer token
  token_type: data.token_type,
  expires_in: data.expires_in,            // ← Used for expiration validation
  loginTime: new Date().toISOString()     // ← Timestamp for expiration calculation
}));
```

**Stored Data Structure:**
```javascript
{
  user: {...},                    // User info from backend
  access_token: "eyJhbGc...",    // JWT or token string
  token_type: "bearer",
  expires_in: 3600,              // Seconds until expiration
  loginTime: "2024-01-15T10:30:00.000Z"  // ISO timestamp
}
```

---

## 2. Token Retrieval & Validation

### Helper Functions (Used in both `page.js` and `NewChatComponent.js`)

#### A. `getStoredAuthData()` - Retrieves token from localStorage
```javascript
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
```

#### B. `isTokenValid()` - Validates token expiration
```javascript
const isTokenValid = (authData) => {
  if (!authData || !authData.loginTime || !authData.expires_in) {
    return false;
  }
  
  const loginTime = new Date(authData.loginTime);
  const expirationTime = new Date(loginTime.getTime() + (authData.expires_in * 1000));
  const now = new Date();
  
  return now < expirationTime;
};
```

**Validation Logic:**
- Checks if `loginTime` and `expires_in` exist
- Calculates expiration time: `loginTime + expires_in (milliseconds)`
- Returns `true` if current time < expiration time

---

## 3. Token Usage Pattern (Applied to All Python Backend APIs)

### Standard Pattern for All API Calls:

```javascript
// Step 1: Get stored auth data
const authData = getStoredAuthData();

// Step 2: Prepare headers
const headers = {
  'Content-Type': 'application/json',
};

// Step 3: Add Authorization header if token is valid
if (authData && isTokenValid(authData)) {
  headers['Authorization'] = `Bearer ${authData.access_token}`;
  console.log('🔐 Using stored auth token for [API_NAME]');
} else {
  console.warn('⚠️ No valid auth token found for [API_NAME]');
}

// Step 4: Make API call with headers
const response = await fetch(`${API_BASE_URL}/api/[endpoint]`, {
  method: 'POST' | 'GET' | 'DELETE',
  headers: headers,
  body: JSON.stringify(payload)  // if needed
});
```

---

## 4. APIs Using Authorization Tokens

### A. Upload API (`/api/data/upload`)

**Location:** `src/app/page.js` - `handleCampaignClick` function

**Usage:**
- **Method:** `POST`
- **Endpoint:** `${API_BASE_URL}/api/data/upload?campaign_id=${campaign.id}`
- **Purpose:** Upload campaign data to Python backend
- **When:** After clicking a campaign, before opening chat

**Code:**
```javascript
// Get stored auth token for authorization
const authData = getStoredAuthData();
const headers = {
  'Content-Type': 'application/json',
};

// Add authorization header if token is available and valid
if (authData && isTokenValid(authData)) {
  headers['Authorization'] = `Bearer ${authData.access_token}`;
  console.log('🔐 Using stored auth token for data upload');
} else {
  console.warn('⚠️ No valid auth token found for data upload');
}

const uploadResponse = await fetch(`${API_BASE_URL}/api/data/upload?campaign_id=${campaign.id}`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(pythonApiPayload)
});
```

---

### B. Stream API (`/api/chat/stream`)

**Location:** 
- `src/app/page.js` - `sendMessage` function (line ~258)
- `src/components/NewChatComponent.js` - `sendMessage` function (line ~430)

**Usage:**
- **Method:** `POST`
- **Endpoint:** `${API_BASE_URL}/api/chat/stream`
- **Purpose:** Stream chat responses from AI chatbot
- **When:** User sends a message in the chat

**Code:**
```javascript
// Get stored auth data for user ID and token
const authData = getStoredAuthData();

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
```

---

### C. Conversations/Load API (`/api/chat/conversations`)

**Location:**
- `src/app/page.js` - `handleCampaignClick` function (line ~610)
- `src/components/NewChatComponent.js` - `handleCampaignSelect` function (line ~139)
- `src/components/NewChatComponent.js` - `useEffect` hook (line ~78)

**Usage:**
- **Method:** `GET`
- **Endpoint:** `${API_BASE_URL}/api/chat/conversations?campaign_id=${campaign.id}`
- **Purpose:** Load previous chat conversations for a campaign
- **When:** 
  - After uploading campaign data (to load existing conversations)
  - When selecting a campaign from sidebar
  - When chat component mounts with campaign data

**Code:**
```javascript
// Get stored auth data for authorization
const authData = getStoredAuthData();
const headers = {
  'Content-Type': 'application/json',
};

// Add authorization header if token is available and valid
if (authData && isTokenValid(authData)) {
  headers['Authorization'] = `Bearer ${authData.access_token}`;
  console.log('🔐 Using stored auth token for [conversations/load]');
} else {
  console.warn('⚠️ No valid auth token found for [conversations/load]');
}

const conversationsResponse = await fetch(`${API_BASE_URL}/api/chat/conversations?campaign_id=${campaign.id}`, {
  method: 'GET',
  headers: headers
});
```

---

### D. Campaigns API (`/api/data/campaigns`)

**Location:** `src/components/NewChatComponent.js` - `fetchCampaigns` function (line ~72)

**Usage:**
- **Method:** `GET`
- **Endpoint:** `${API_BASE_URL}/api/data/campaigns`
- **Purpose:** Fetch list of campaigns from Python backend
- **When:** Loading campaigns list in sidebar

**Code:**
```javascript
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

const campaignsResponse = await fetch(`${API_BASE_URL}/api/data/campaigns`, {
  method: 'GET',
  headers: headers
});
```

---

### E. Clear API (`/api/data/clear`)

**Location:** `src/components/NewChatComponent.js` - `clearChat` function (line ~523)

**Usage:**
- **Method:** `DELETE`
- **Endpoint:** `${API_BASE_URL}/api/data/clear`
- **Purpose:** Clear chat data on backend
- **When:** User clicks clear chat button

**Code:**
```javascript
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

const clearResponse = await fetch(`${API_BASE_URL}/api/data/clear`, {
  method: 'DELETE',
  headers: headers
});
```

---

## 5. Key Patterns & Best Practices

### ✅ Consistent Token Handling
- All Python backend API calls use the same pattern
- Token is always retrieved from `localStorage` using `getStoredAuthData()`
- Token is always validated using `isTokenValid()` before adding to headers
- Authorization header format: `Authorization: Bearer <token>`

### ✅ Error Handling
- If token is missing or invalid, API call still proceeds but without Authorization header
- Console warnings are logged for debugging
- Frontend gracefully handles API errors (401, 403, etc.)

### ✅ Token Expiration
- Token expiration is checked client-side before each API call
- Expired tokens are not sent to backend
- `loginTime` + `expires_in` determines expiration

### ✅ localStorage Key
- Consistent key name: `'userAuth'`
- Data is JSON stringified/parsed
- Structure is consistent across the application

---

## 6. Summary Checklist for Implementation

When applying this pattern to another branch, ensure:

- [ ] `getStoredAuthData()` helper function exists
- [ ] `isTokenValid()` helper function exists  
- [ ] Token is stored in `localStorage` with key `'userAuth'` after login
- [ ] Token includes: `access_token`, `expires_in`, `loginTime`
- [ ] All Python backend API calls follow the pattern:
  1. Get auth data: `const authData = getStoredAuthData();`
  2. Prepare headers: `const headers = { 'Content-Type': 'application/json' };`
  3. Add Authorization if valid: `if (authData && isTokenValid(authData)) { headers['Authorization'] = \`Bearer ${authData.access_token}\`; }`
  4. Make API call with headers
- [ ] APIs using tokens:
  - [ ] Upload API (`/api/data/upload`)
  - [ ] Stream API (`/api/chat/stream`)
  - [ ] Conversations API (`/api/chat/conversations`)
  - [ ] Campaigns API (`/api/data/campaigns`)
  - [ ] Clear API (`/api/data/clear`)

---

## Notes

- The token comes from Python backend's `/api/auth/facebook/login` endpoint after NextAuth Facebook login
- Frontend Facebook API calls (to Graph API) use NextAuth session token, NOT the localStorage token
- Only Python backend APIs use the Bearer token from localStorage
- Token validation is client-side; backend should also validate tokens server-side

