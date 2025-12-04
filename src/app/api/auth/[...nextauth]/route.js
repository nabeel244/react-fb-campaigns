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
    async jwt({ token, account, user }) {
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
      // Redirect user based on callbackUrl or default to home
      if (url.startsWith(baseUrl)) {
        return url; // Use the callbackUrl from signIn
      }
      return baseUrl; // Default fallback
    },
  },
  pages: {
    signIn: "/login", // Custom login page
    error: "/auth/error", // Custom error page
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
