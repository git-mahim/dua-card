import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId =
  process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: googleClientId || "google_client_id_placeholder",
      clientSecret: googleClientSecret || "google_client_secret_placeholder",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  secret:
    process.env.AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "dua_card_super_secret_jwt_encryption_key_2026_vercel",
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.email && session.user) {
        session.user.email = token.email as string;
        session.user.name = (token.name as string) || session.user.name;
        session.user.image = (token.picture as string) || session.user.image;
      }
      return session;
    },
  },
});
