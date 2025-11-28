# Fixing Google OAuth 403: access_denied Error

## The Problem

You're getting `Error 403: access_denied` because the Google Ads API scope (`https://www.googleapis.com/auth/adwords`) requires special approval and verification from Google.

---

## Solution Options

### Option 1: Fix OAuth Consent Screen (Recommended for Development)

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/apis/credentials/consent
   - Select your project

2. **Configure OAuth Consent Screen**
   - User Type: Select **"External"** (for testing) or **"Internal"** (if using Google Workspace)
   - Click **"Create"**

3. **Fill in App Information**
   - App name: Your app name
   - User support email: Your email
   - Developer contact information: Your email
   - Click **"Save and Continue"**

4. **Add Scopes**
   - Click **"Add or Remove Scopes"**
   - Add these scopes:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/adwords` (if you need it)
   - Click **"Update"** then **"Save and Continue"**

5. **Add Test Users** (IMPORTANT!)
   - Under **"Test users"**, click **"Add Users"**
   - Add the Google account email you're using to test
   - Click **"Save and Continue"**

6. **Review and Publish**
   - Click **"Back to Dashboard"**
   - If in Testing mode, make sure your email is in the test users list

---

### Option 2: Remove AdWords Scope (For Basic Testing)

If you just need basic Google login without Ads API access right now, you can temporarily remove the AdWords scope:

Update your `.env` to temporarily remove AdWords access, or we can update the NextAuth config to make it optional.

---

### Option 3: Use Basic Scopes First (Recommended)

For initial testing, let's start with basic scopes and add AdWords later:

**Temporarily change the scope to:**
```javascript
scope: "openid email profile"
```

Once basic login works, we can add the AdWords scope back.

---

## Step-by-Step Fix (Choose One)

### Quick Fix: Remove AdWords Scope Temporarily

1. We'll update the NextAuth config to use basic scopes first
2. Test that Google login works
3. Then add AdWords scope back once OAuth consent screen is properly configured

### Proper Fix: Configure OAuth Consent Screen

1. Go to Google Cloud Console → OAuth consent screen
2. Set app to "Testing" mode
3. Add your email as a test user
4. Add all required scopes
5. Save and test again

---

## Common Issues

### Issue: "This app isn't verified"
**Solution:** 
- Make sure you're in "Testing" mode
- Add yourself as a test user
- Click "Continue" when you see the warning

### Issue: "Access blocked"
**Solution:**
- Your email must be in the "Test users" list
- Make sure you're using the same Google account

### Issue: "Sensitive scopes require verification"
**Solution:**
- For development/testing: Use "Testing" mode and add test users
- For production: You'll need to submit your app for Google's verification process (takes several weeks)

---

## What to Do Now

1. **Go to OAuth Consent Screen** in Google Cloud Console
2. **Add your email as a Test User**
3. **Try logging in again**

If you want, I can also update the code to temporarily use basic scopes (without AdWords) so you can test the login flow first.

