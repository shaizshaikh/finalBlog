
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Toaster } from '@/components/ui/toaster';
import { RuntimeConfigProvider } from '@/contexts/RuntimeConfigContext';
import { Suspense } from 'react'; // Import Suspense

export const metadata: Metadata = {
  title: 'Cloud Journal',
  description: 'A modern journal for cloud enthusiasts and developers.',
};

// A simple skeleton/placeholder for the Header
function HeaderPlaceholder() {
  return <div className="sticky top-0 z-50 h-[60px] w-full bg-card border-b border-border" />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
            <Suspense fallback={<HeaderPlaceholder />}>
              <Header />
            </Suspense>
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
