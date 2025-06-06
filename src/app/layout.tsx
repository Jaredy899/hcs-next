import "~/styles/globals.css";

import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "~/lib/convex-clerk-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "HCS Case Management System",
  description: "Highland County Services Case Management System",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body>
          <ConvexProviderWithClerk>
            {children}
            <Toaster />
          </ConvexProviderWithClerk>
        </body>
      </html>
    </ClerkProvider>
  );
}
