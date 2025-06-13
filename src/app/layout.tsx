
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { RuntimeConfigProvider } from '@/contexts/RuntimeConfigContext';

export const metadata: Metadata = {
  title: 'Cloud Journal',
  description: 'A modern journal for cloud enthusiasts and developers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read from NEXT_PUBLIC_ prefixed versions for build-time availability to server components
  // These values will be passed to the RuntimeConfigProvider and become "runtime" for client components
  const adminSecretUrlSegment = process.env.ADMIN_SECRET_URL_SEGMENT;
  const baseUrl = process.env.BASE_URL;

  if (!adminSecretUrlSegment) {
    console.warn("RootLayout: ADMIN_SECRET_URL_SEGMENT is not defined. Admin links might use fallback. Ensure this env var is set.");
  }
  if (!baseUrl) {
    console.warn("RootLayout: BASE_URL is not defined. Functionality relying on it might use fallback. Ensure this env var is set.");
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <RuntimeConfigProvider 
          adminSecretUrlSegment={adminSecretUrlSegment}
          baseUrl={baseUrl}
        >
          <AppProviders>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
            <Toaster />
          </AppProviders>
        </RuntimeConfigProvider>
      </body>
    </html>
  );
}
