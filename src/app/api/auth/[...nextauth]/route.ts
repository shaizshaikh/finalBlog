
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
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!credentials || !adminUsername || !adminPassword) {
          console.error("NextAuth: Admin credentials or .env variables not set properly.");
          return null;
        }

        if (credentials.username === adminUsername && credentials.password === adminPassword) {
          return { id: "1", name: adminUsername, role: "admin" };
        } else {
          console.log("NextAuth: Invalid credentials provided.");
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
    signIn: `/${process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT}/login`, // Custom login page
    error: `/${process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT}/login`, // Redirect to login on error
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
