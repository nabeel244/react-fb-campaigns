# Production Setup for Google Ads API

## Quick Answer: Do You Need Verification?

**Short answer:** 
- **NO** - If you're using Testing mode and adding authorized users
- **YES** - If you want anyone to use your app without restrictions

---

## Option 1: Testing Mode (No Verification Needed) ✅ Recommended for Most Cases

This is the easiest path and works for production use with a controlled set of users.

### Setup Steps:

1. **Go to Google Cloud Console OAuth Consent Screen**
   - Visit: https://console.cloud.google.com/apis/credentials/consent
   - Select your project

2. **Set App to Testing Mode**
   - Under "Publishing status", you should see "Testing"
   - If not, click "Edit App" and ensure it's set to Testing

3. **Add Required Scopes**
   - Click "Edit App" or "ADD OR REMOVE SCOPES"
   - Make sure these scopes are added:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/adwords`

4. **Add Authorized Users (Test Users)**
   - Scroll to "Test users" section
   - Click "+ ADD USERS"
   - Add email addresses of users who need access:
     - Your own email (the one you use to log in)
     - Any other team members who need access
   - Click "Add"
   - **Note:** You can add up to 100 test users

5. **Save Changes**
   - Click "Save and Continue" if editing
   - Make sure all changes are saved

### What Users Will See:
- Users will see an "unverified app" warning
- They can click "Continue" or "Advanced" → "Go to [Your App] (unsafe)" to proceed
- This is normal for testing mode apps

### Pros:
- ✅ Works immediately (no waiting)
- ✅ No verification process needed
- ✅ Can add up to 100 users
- ✅ Perfect for internal/team use
- ✅ Can use with production Google Ads accounts

### Cons:
- ⚠️ Users see "unverified app" warning
- ⚠️ Must manually add each user
- ⚠️ Limited to 100 test users

---

## Option 2: Full Verification (For Public Apps)

Only needed if you want to make your app public and available to everyone without restrictions.

### When You Need Verification:
- Your app will be used by many users (more than 100)
- You want to remove the "unverified app" warning
- You're building a public SaaS product
- You want to publish your app to Google Workspace Marketplace

### Verification Process:
1. **Prepare Your App**
   - Complete all OAuth consent screen fields
   - Add all required scopes
   - Provide privacy policy URL
   - Provide terms of service URL
   - Provide app homepage URL

2. **Submit for Verification**
   - Go to OAuth consent screen
   - Click "PUBLISH APP" button
   - Fill out verification form
   - Submit required documentation

3. **Google Review Process**
   - Google reviews your submission
   - They may request additional information
   - Process typically takes 1-3 weeks
   - You'll receive email updates

### Required Documents:
- Privacy Policy (must be publicly accessible)
- Terms of Service (if applicable)
- Video demonstration of your app
- Detailed explanation of how you use Google Ads API
- Security practices documentation

### Pros:
- ✅ No user limits
- ✅ No "unverified app" warning
- ✅ Professional appearance
- ✅ Required for public apps

### Cons:
- ❌ Takes 1-3 weeks to complete
- ❌ Requires documentation and preparation
- ❌ More complex process

---

## Recommended Path for Your Use Case

Based on your requirements (production-level access, no test user complexity):

### Step 1: Use Testing Mode (Do This Now)
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Make sure app is in "Testing" mode
3. Add yourself and your team members as test users
4. Add the AdWords scope if not already added
5. Save and test

### Step 2: Test Your Integration
1. Logout and login again in your app
2. You should be able to access Google Ads API
3. You'll see the "unverified app" warning - click through it

### Step 3: (Optional) Submit for Verification Later
- Only if you need to make it public
- Only if you have more than 100 users
- You can do this later when needed

---

## Important Notes

1. **"Test Users" ≠ Google Ads Test Accounts**
   - Test users in OAuth = authorized users of your app
   - Google Ads test accounts = test ad accounts in Google Ads
   - These are completely different things!

2. **You Can Use Production Google Ads Accounts**
   - Even in Testing mode, you can access production Google Ads accounts
   - The "testing" refers to OAuth consent screen mode, not your ad accounts

3. **Developer Token Access Level**
   - Your developer token's access level (Test/Basic/Standard) determines what ad accounts you see
   - This is separate from OAuth consent screen mode

---

## Current Status Check

To check your current setup:

1. **OAuth Consent Screen Status:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Check "Publishing status" - should show "Testing" or "In production"

2. **Test Users:**
   - In same page, scroll to "Test users"
   - Make sure your email is listed

3. **Scopes:**
   - Check that `https://www.googleapis.com/auth/adwords` is included

---

## Quick Checklist

For Testing Mode Setup:
- [ ] OAuth consent screen is in "Testing" mode
- [ ] AdWords scope is added
- [ ] Your email is added as a test user
- [ ] All changes are saved
- [ ] You've logged out and logged in again to get new token

For Verification (Later):
- [ ] App is ready for public use
- [ ] Privacy policy is published
- [ ] All documentation is prepared
- [ ] Ready to wait 1-3 weeks for review

---

## Need Help?

If you're getting "Access blocked" errors:
1. Make sure your email is in the test users list
2. Make sure you're using the same Google account
3. Try logging out and logging in again
4. Check that AdWords scope is included

If you're unsure which path to take:
- **Start with Testing Mode** - it's easier and works for most cases
- **Submit for verification later** - only when you really need it

