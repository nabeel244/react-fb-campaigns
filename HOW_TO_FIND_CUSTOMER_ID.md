# How to Find Your Google Ads Customer ID

## Method 1: From the URL (Easiest)

1. **Log into Google Ads**: https://ads.google.com
2. **Look at the URL in your browser** - it will show something like:
   ```
   https://ads.google.com/aw/account?customerId=1234567890
   ```
3. **The number after `customerId=` is your Customer ID**
   - Example: If URL shows `customerId=1234567890`, then your ID is `1234567890`

## Method 2: From Account Settings

1. **Log into Google Ads**: https://ads.google.com
2. **Click on the gear icon** (⚙️) in the top right corner
3. **Click "Account settings"** (or "Setup" → "Account settings")
4. **Look for "Customer ID"** - it's displayed at the top of the page
   - Format: 10-digit number like `1234567890`

## Method 3: From the Account Dropdown

1. **Log into Google Ads**: https://ads.google.com
2. **Click on your account name** in the top right (next to the gear icon)
3. **The Customer ID is displayed** in the dropdown menu below your account name

## For Manager Accounts

If you're in a **Manager Account**, you'll see multiple accounts:

1. **Manager Account ID**: The ID of the manager account itself
2. **Client Account IDs**: Each account under the manager has its own ID

### To Find Client Account IDs:

1. **Go to "Accounts"** in the left menu
2. **Click on a specific account** you want to use
3. **The Customer ID will be in the URL** or in that account's settings

## Important Notes

- **Customer ID format**: Always 10 digits (e.g., `1234567890`)
- **Manager vs Client**: 
  - Manager Account: Used to manage multiple accounts
  - Client Account: Individual advertising accounts
- **For testing**: Use a **test client account** ID (test accounts are created under the manager account)

## Quick Test

Once you have the Customer ID:

1. Add it to your `.env` file:
   ```env
   GOOGLE_ADS_TEST_CUSTOMER_ID=1234567890
   ```
2. Replace `1234567890` with your actual ID
3. Restart your dev server
4. Test at `/google` page

