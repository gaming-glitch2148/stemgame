import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || "temporary_development_secret_change_me_in_vercel";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: "538949501638-soq5mj0gnqubhl9uvkdmj5d4bmoldq2p.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // PKCE flow is more robust for Google login
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: AUTH_SECRET,
  debug: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
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
