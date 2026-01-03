import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

if (!process.env.NEXTAUTH_SECRET) {
  console.error("CRITICAL ERROR: NEXTAUTH_SECRET is not defined in environment variables.");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("CRITICAL ERROR: GOOGLE_CLIENT_SECRET is not defined in environment variables.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: "538949501638-soq5mj0gnqubhl9uvkdmj5d4bmoldq2p.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // This will print detailed error messages in Vercel Logs
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
