import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

// FALLBACK SECRET FOR TROUBLESHOOTING
// In production, this SHOULD be set via Vercel Environment Variables as NEXTAUTH_SECRET
const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "temporary_development_secret_change_me_in_vercel";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: "538949501638-soq5mj0gnqubhl9uvkdmj5d4bmoldq2p.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "missing_secret",
    }),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  secret: AUTH_SECRET,
  debug: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
