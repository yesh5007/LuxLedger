"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Loader2, ExternalLink, Clock, Fingerprint, CheckCircle2, Shield } from "lucide-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from 'wagmi';
import { useState, useEffect } from "react";
import { getRegisteredAssetsByIssuer, RegisteredAssetEvent } from "@/lib/services/blockchain-service";
import { TopNav } from "@/components/ui/top-nav";

export default function DashboardPage() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const [assets, setAssets] = useState<RegisteredAssetEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchMyAssets(address);
    } else {
      setIsLoading(false);
    }
  }, [isConnected, address]);

  const fetchMyAssets = async (userAddress: string) => {
    setIsLoading(true);
    const result = await getRegisteredAssetsByIssuer(userAddress);
    if (result.success && result.assets) {
      setAssets(result.assets);
    } else {
      console.error("Failed to fetch dashboard assets:", result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <TopNav />

      <main className="flex-1 container py-10 max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 font-serif flex items-center gap-2">
              <LayoutDashboard className="h-7 w-7 text-amber-600" />
              Issuer Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage and review your personally issued, cryptographically secured assets.
            </p>
          </div>
          {isConnected && (
            <Button onClick={() => address && fetchMyAssets(address)} variant="outline" disabled={isLoading} className="shadow-sm">
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LayoutDashboard className="w-4 h-4 mr-2" />}
              Sync Ledger
            </Button>
          )}
        </div>

        {!isConnected ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center flex flex-col items-center">
            <Shield className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-xl font-bold mb-2">Wallet Disconnected</h2>
            <p className="text-slate-500 mb-6 max-w-sm">Please connect your authorized issuer wallet to access your private dashboard and transaction history.</p>
            <Button onClick={() => open()} className="bg-amber-600 hover:bg-amber-700">Connect to Dashboard</Button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-6 py-4">Issuance Date</th>
                    <th className="px-6 py-4">Document Fingerprint (SHA-256)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Polygon Amoy Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2 text-amber-600" />
                        <p>Syncing personal transactions from the blockchain...</p>
                      </td>
                    </tr>
                  ) : assets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        You have not issued any documents using this wallet address yet.
                        <div className="mt-4">
                          <Link href="/issuer">
                            <Button variant="default" className="bg-amber-600 hover:bg-amber-700">
                              Issue Your First Asset
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    assets.map((asset, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-slate-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4 opacity-50" />
                            <span className="font-medium">
                              {new Date(asset.timestamp * 1000).toLocaleDateString()}
                            </span>
                            <span className="text-xs opacity-70">
                              {new Date(asset.timestamp * 1000).toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Fingerprint className="w-4 h-4 text-emerald-600 opacity-70" />
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 break-all select-all">
                              {asset.dataHash}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded w-fit border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Anchored
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <a
                            href={`https://amoy.polygonscan.com/tx/${asset.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition"
                          >
                            View Tx <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
