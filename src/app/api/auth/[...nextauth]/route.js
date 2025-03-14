import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions = {
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        url: "https://www.facebook.com/v19.0/dialog/oauth",
        params: {
          scope: "ads_read,business_management,email", // Required permissions
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // Store the refresh token as well if needed
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect user to home page after successful login
      if (url.startsWith(baseUrl)) {
        return baseUrl; // Always return the home page URL
      }
      return url;
    },
  },
  pages: {
    signIn: "/login", // Custom login page
    error: "/auth/error", // Custom error page
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
