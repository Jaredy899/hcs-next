"use client";

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

export function ConvexProviderWithClerk({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  
  const convexAuth = useMemo(() => ({
    isLoading: !auth.isLoaded,
    isAuthenticated: auth.isLoaded && !!auth.isSignedIn && !!auth.userId,
    fetchAccessToken: async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        // Only fetch token if fully authenticated
        if (!auth.isLoaded || !auth.isSignedIn || !auth.userId || !auth.sessionId) {
          return null;
        }
        
        const token = await auth.getToken({ 
          template: "convex",
          skipCache: forceRefreshToken 
        });
        return token;
      } catch (error) {
        console.error("Error fetching access token:", error);
        return null;
      }
    },
  }), [auth]);

  return (
    <ConvexProviderWithAuth client={convex} useAuth={() => convexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
} 