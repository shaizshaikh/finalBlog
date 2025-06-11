
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
        // This is where you'd typically lookup the user in your database
        // For this example, we're using hardcoded environment variables
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!credentials || !adminUsername || !adminPassword) {
          console.error("NextAuth: Admin credentials or .env variables not set properly.");
          return null;
        }

        // IMPORTANT: In a real production app with multiple users,
        // you should HASH passwords and compare the hash.
        // For a single admin with a strong password stored as an env var, this direct comparison is simpler.
        if (credentials.username === adminUsername && credentials.password === adminPassword) {
          // Any object returned will be saved in `user` property of the JWT
          return { id: "1", name: adminUsername, role: "admin" }; // Add any user info you want in the session
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          console.log("NextAuth: Invalid credentials provided.");
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt', // Using JWT for sessions
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the role if using it
      if (user?.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user && token.role) {
        (session.user as any).role = token.role;
      }
      if (session.user && token.sub) { // token.sub is the user id
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  pages: {
    signIn: `/${process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT}/login`, // Custom login page
    error: `/${process.env.NEXT_PUBLIC_ADMIN_SECRET_URL_SEGMENT}/login`, // Redirect to login on error
  },
  secret: process.env.NEXTAUTH_SECRET, // For signing JWTs
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
