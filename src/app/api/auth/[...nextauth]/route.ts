
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[NextAuth][authorize] Attempting to authorize credentials:", credentials ? JSON.stringify(credentials, (key, value) => key === 'password' ? '******' : value) : "No credentials received");
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        console.log(`[NextAuth][authorize] ADMIN_USERNAME from env: "${adminUsername}" (type: ${typeof adminUsername})`);
        console.log(`[NextAuth][authorize] ADMIN_PASSWORD from env: "${adminPassword ? '******' : 'NOT SET or EMPTY'}" (type: ${typeof adminPassword})`);

        if (!credentials) {
          console.error("[NextAuth][authorize] No credentials object received by authorize function.");
          return null;
        }
        if (!adminUsername || !adminPassword) {
          console.error("[NextAuth][authorize] Critical: ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set or are empty in the NextAuth API route handler's context.");
          return null;
        }

        const usernameMatch = credentials.username === adminUsername;
        const passwordMatch = credentials.password === adminPassword;

        console.log(`[NextAuth][authorize] Username match result: ${usernameMatch}`);
        console.log(`[NextAuth][authorize] Password match result: ${passwordMatch}`);

        if (usernameMatch && passwordMatch) {
          console.log("[NextAuth][authorize] Credentials match. Authorizing user:", adminUsername);
          return { id: "1", name: adminUsername, role: "admin" };
        } else {
          console.log("[NextAuth][authorize] Credentials do not match based on comparison.");
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as any).role = token.role;
      }
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  pages: {
    signIn: `/${process.env.ADMIN_SECRET_URL_SEGMENT}/login`,
    error: `/${process.env.ADMIN_SECRET_URL_SEGMENT}/login`,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
