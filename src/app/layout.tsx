
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

// Function to check and log environment variables server-side
function checkServerSideEnvVariables() {
  console.log("--- SERVER-SIDE ENVIRONMENT VARIABLE CHECK (RootLayout) ---");
  const criticalVars = [
    'POSTGRES_URL',
    'NEXTAUTH_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'ADMIN_SECRET_URL_SEGMENT',
    'BASE_URL',
    'GEMINI_API_KEY',
    'GMAIL_USER',
    'GMAIL_PASS',
  ];
  let allGood = true;
  criticalVars.forEach(varName => {
    if (process.env[varName]) {
      if (varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('KEY')) {
        console.log(`[RootLayout Env Check] Var: ${varName} = SET (value redacted)`);
      } else {
        console.log(`[RootLayout Env Check] Var: ${varName} = "${process.env[varName]}"`);
      }
    } else {
      console.error(`[RootLayout Env Check] CRITICAL - Var: ${varName} IS NOT SET!`);
      allGood = false;
    }
  });
  if (allGood) {
    console.log("[RootLayout Env Check] Status: All critical server-side environment variables appear to be set.");
  } else {
    console.error("[RootLayout Env Check] Status: AT LEAST ONE CRITICAL SERVER-SIDE ENV VARIABLE IS MISSING. This is a likely cause for Internal Server Errors when running the standalone server (npm start). Ensure .env is complete or variables are injected into the production environment.");
  }
  console.log("--- END SERVER-SIDE ENVIRONMENT VARIABLE CHECK ---");
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Run the check when RootLayout is rendered on the server
  if (typeof window === 'undefined') { // Ensure this only runs server-side
    checkServerSideEnvVariables();
  }

  const adminSecretUrlSegment = process.env.ADMIN_SECRET_URL_SEGMENT;
  const baseUrl = process.env.BASE_URL;

  // console.warn("[RootLayout] ADMIN_SECRET_URL_SEGMENT read from server process.env:", adminSecretUrlSegment); // Previous logging

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
