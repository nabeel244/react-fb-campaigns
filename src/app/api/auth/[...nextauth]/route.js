import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        url: "https://www.facebook.com/v23.0/dialog/oauth",
        params: {
          scope: "ads_read,business_management,email", // Required permissions
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Production: Always include AdWords scope for Google Ads API access
          // This is REQUIRED to access Google Ads API (both test and production accounts)
          // For production use, ensure your app is verified or add authorized users in Google Cloud Console
          scope: "openid email profile https://www.googleapis.com/auth/adwords",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider; // Store which provider was used
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.provider = token.provider; // Include provider in session
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Parse the URL to check for callbackUrl parameter
      try {
        const urlObj = new URL(url, baseUrl);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        
        // If callbackUrl is provided as a query parameter, use it
        if (callbackUrl) {
          // Make it absolute if it's relative
          if (callbackUrl.startsWith('/')) {
            return `${baseUrl}${callbackUrl}`;
          }
          // Use as-is if it's already absolute
          if (callbackUrl.startsWith(baseUrl) || callbackUrl.startsWith('http://') || callbackUrl.startsWith('https://')) {
            return callbackUrl;
          }
        }
      } catch (e) {
        // URL parsing failed, continue with other checks
      }
      
      // If the URL itself is a callback URL path, extract provider and redirect accordingly
      if (url.includes('/api/auth/callback/facebook')) {
        // Check if there's a callbackUrl in the full URL
        try {
          const urlObj = new URL(url, baseUrl);
          const callbackUrl = urlObj.searchParams.get('callbackUrl');
          if (callbackUrl) {
            if (callbackUrl.startsWith('/')) {
              return `${baseUrl}${callbackUrl}`;
            }
            return callbackUrl;
          }
        } catch (e) {
          // Fall through to default redirect
        }
        return `${baseUrl}/dashboard`;
      }
      
      if (url.includes('/api/auth/callback/google')) {
        // Check if there's a callbackUrl in the full URL
        try {
          const urlObj = new URL(url, baseUrl);
          const callbackUrl = urlObj.searchParams.get('callbackUrl');
          if (callbackUrl) {
            if (callbackUrl.startsWith('/')) {
              return `${baseUrl}${callbackUrl}`;
            }
            return callbackUrl;
          }
        } catch (e) {
          // Fall through to default redirect
        }
        return `${baseUrl}/google`;
      }
      
      // If callbackUrl is provided (as absolute URL), use it directly
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // If callbackUrl is a relative path, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Default fallback to home
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login", // Custom login page
    error: "/auth/error", // Custom error page
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
