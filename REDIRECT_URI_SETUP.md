# Google OAuth Redirect URI Setup Guide

## Important: NextAuth automatically generates the redirect URI

NextAuth.js automatically creates the redirect URI based on `NEXTAUTH_URL`. You don't need to manually set a `GOOGLE_REDIRECT_URI` variable.

---

## Step 1: Add to your `.env` file

Add this line to your `.env` file:

### For Local Development:
```env
NEXTAUTH_URL=http://localhost:3000
```

### For Production:
```env
NEXTAUTH_URL=https://yourdomain.com
```

**Note:** NextAuth will automatically use this to create the redirect URI as:
```
{NEXTAUTH_URL}/api/auth/callback/google
```

So if `NEXTAUTH_URL=http://localhost:3000`, the redirect URI becomes:
```
http://localhost:3000/api/auth/callback/google
```

---

## Step 2: Add Redirect URI in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Click on your **OAuth 2.0 Client ID** (the one matching your `GOOGLE_CLIENT_ID`)
5. In the **Authorized redirect URIs** section, click **ADD URI**
6. Add this exact redirect URI:

### For Development (Localhost):
```
http://localhost:3000/api/auth/callback/google
```

### For Production (replace with your domain):
```
https://yourdomain.com/api/auth/callback/google
```

**Important:** Add both if you're testing locally AND deploying to production.

---

## Complete Example `.env` File

```env
# NextAuth Configuration (REQUIRED for redirect URI)
NEXTAUTH_URL=http://localhost:3000

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Facebook OAuth (if using)
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret

# Optional: Google Ads API
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
```

---

## Quick Checklist

✅ **In `.env` file:**
- [ ] Added `NEXTAUTH_URL=http://localhost:3000` (or your production URL)

✅ **In Google Cloud Console:**
- [ ] Added redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] Added production redirect URI if deploying: `https://yourdomain.com/api/auth/callback/google`

✅ **After making changes:**
- [ ] Restarted your Next.js dev server
- [ ] Cleared browser cache (if still getting errors)

---

## What you DON'T need:

❌ **You do NOT need** `GOOGLE_REDIRECT_URI` in your `.env` file
❌ NextAuth automatically constructs it from `NEXTAUTH_URL`

---

## Common Errors & Solutions

### Error: "redirect_uri_mismatch"
**Solution:** 
- Make sure the redirect URI in Google Console **exactly matches**:
  - `http://localhost:3000/api/auth/callback/google` (for dev)
  - Must include `/api/auth/callback/google` at the end
  - Must match your `NEXTAUTH_URL` exactly

### Error: "Invalid redirect URI"
**Solution:**
- Check that `NEXTAUTH_URL` in `.env` matches your actual URL
- Make sure you restarted the server after adding `NEXTAUTH_URL`
- Verify no trailing slashes: `http://localhost:3000` not `http://localhost:3000/`

---

## How It Works

1. You set `NEXTAUTH_URL=http://localhost:3000` in `.env`
2. NextAuth automatically creates callback route: `/api/auth/callback/google`
3. Full redirect URI becomes: `http://localhost:3000/api/auth/callback/google`
4. You add this same URI to Google Cloud Console
5. Everything matches! ✅
