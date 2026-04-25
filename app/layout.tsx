import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { cookieToInitialState } from "wagmi";
import { config, projectId, metadata as WMetadata } from "@/lib/config";
import { headers } from "next/headers";
import WagmiProviderComp from "@/lib/wagmi-provider";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";

if (!projectId) throw new Error("Project ID is not defined");

// Create modal
createWeb3Modal({
  metadata: WMetadata,
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
});


export const metadata: Metadata = {
  title: "LuxLedger",
  description: "Immutable proof of authenticity for luxury goods. AI-powered verification anchored to Polygon.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const initialState = cookieToInitialState(config, headersList.get("cookie"));


  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider defaultTheme="system">
          <WagmiProviderComp initialState={initialState}>
            {children}
          </WagmiProviderComp>
        </ThemeProvider>
      </body>
    </html>
  );
}
