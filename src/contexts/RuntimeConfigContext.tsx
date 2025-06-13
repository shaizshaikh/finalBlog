
"use client";

import React, { createContext, useContext, type ReactNode } from 'react';

interface RuntimeConfig {
  adminSecretUrlSegment: string;
  baseUrl: string;
}

const RuntimeConfigContext = createContext<RuntimeConfig | undefined>(undefined);

interface RuntimeConfigProviderProps {
  children: ReactNode;
  adminSecretUrlSegment: string | undefined; // Allow undefined initially from process.env
  baseUrl: string | undefined; // Allow undefined initially
}

export const RuntimeConfigProvider = ({
  children,
  adminSecretUrlSegment,
  baseUrl,
}: RuntimeConfigProviderProps) => {
  // Fallback values are important if env vars are somehow not set,
  // though the build should ideally fail or they should be defaulted earlier.
  const config: RuntimeConfig = {
    adminSecretUrlSegment: adminSecretUrlSegment || "admin", // Default fallback
    baseUrl: baseUrl || "http://localhost:3000", // Default fallback
  };

  if (!adminSecretUrlSegment) {
    console.warn("RuntimeConfigContext: adminSecretUrlSegment is undefined or empty. Falling back to default.");
  }
  if (!baseUrl) {
    console.warn("RuntimeConfigContext: baseUrl is undefined or empty. Falling back to default.");
  }

  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
};

export const useRuntimeConfig = (): RuntimeConfig => {
  const context = useContext(RuntimeConfigContext);
  if (context === undefined) {
    throw new Error('useRuntimeConfig must be used within a RuntimeConfigProvider');
  }
  return context;
};
