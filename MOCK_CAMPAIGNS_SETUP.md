# Mock Campaign Data Setup

Since the Google Ads API REST interface doesn't support querying campaigns (returns 501 error), mock/test campaign data is now enabled by default for demonstration purposes.

## How It Works

When you click on a Google Ads account, the system will:
1. Try to fetch real campaigns via REST API
2. If REST API returns 501 (not supported), it automatically returns mock campaign data
3. You'll see 3 sample campaigns displayed

## Mock Campaigns

The mock data includes:
- Summer Sale Campaign (Search, Enabled)
- Product Launch Campaign (Display, Enabled)
- Brand Awareness Campaign (Video, Paused)

## To Disable Mock Data

If you want to see the error message instead of mock data, add to your `.env`:

```env
USE_MOCK_CAMPAIGNS=false
```

## To Fetch Real Campaigns

To fetch real campaigns, you would need to:
1. Use the Google Ads API client library (gRPC) instead of REST API
2. Implement the gRPC client in your backend
3. Query campaigns using the gRPC interface

For now, mock data allows you to test and see the UI working properly.

