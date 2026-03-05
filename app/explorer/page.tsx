"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Loader2, ExternalLink, Clock, Fingerprint, Activity, CheckCircle2 } from "lucide-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from 'wagmi';
import { useState, useEffect } from "react";
import { getAllRegisteredAssets, RegisteredAssetEvent } from "@/lib/services/blockchain-service";

export default function ExplorerPage() {
    const { open } = useWeb3Modal();
    const { address, isConnected } = useAccount();
    const [assets, setAssets] = useState<RegisteredAssetEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isConnected) {
            fetchAssets();
        } else {
            setIsLoading(false);
        }
    }, [isConnected]);

    const fetchAssets = async () => {
        setIsLoading(true);
        const result = await getAllRegisteredAssets();
        if (result.success && result.assets) {
            setAssets(result.assets);
        } else {
            console.error("Failed to fetch assets:", result.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            {/* Standard Navigation Header matching the design */}
            <header className="border-b bg-white top-0 sticky z-50">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <Shield className="h-6 w-6 text-purple-600" />
                            <span className="text-xl font-bold font-serif tracking-tight">LuxLedger</span>
                        </Link>
                    </div>

                    {/* Centered Navigation Buttons */}
                    <nav className="hidden md:flex items-center gap-1 bg-white p-1 rounded-lg">
                        <Link href="/">
                            <Button variant="ghost" className="text-slate-500 font-bold tracking-wider hover:text-purple-700">HOME</Button>
                        </Link>
                        <Link href="/issuer">
                            <Button variant="ghost" className="text-slate-500 font-bold tracking-wider hover:text-purple-700">ISSUE</Button>
                        </Link>
                        <Link href="/verifier">
                            <Button variant="ghost" className="text-slate-500 font-bold tracking-wider hover:text-purple-700">VERIFY</Button>
                        </Link>
                        <Link href="/explorer">
                            <Button variant="secondary" className="bg-purple-100/50 text-purple-700 font-bold tracking-wider border border-purple-200">
                                EXPLORER
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button variant="ghost" className="text-slate-500 font-bold tracking-wider hover:text-purple-700">DASHBOARD</Button>
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {!isConnected ? (
                            <Button onClick={() => open()} variant="default" className="bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm">
                                Connect Wallet
                            </Button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-medium">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Polygon Amoy Connected
                                </div>
                                <Button variant="outline" size="sm" onClick={() => open()} className="font-mono text-xs border-slate-200 shadow-sm">
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 container py-10 max-w-5xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 font-serif flex items-center gap-2">
                            <Activity className="h-7 w-7 text-purple-600" />
                            Global Asset Ledger
                        </h1>
                        <p className="text-muted-foreground">
                            Real-time view of all cryptographic document hashes permanently anchored on the Polygon Amoy blockchain.
                        </p>
                    </div>
                    {isConnected && (
                        <Button onClick={fetchAssets} variant="outline" disabled={isLoading} className="shadow-sm">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                            Refresh Ledger
                        </Button>
                    )}
                </div>

                {!isConnected ? (
                    <div className="bg-white rounded-xl shadow-sm border p-12 text-center flex flex-col items-center">
                        <Shield className="h-16 w-16 text-slate-300 mb-4" />
                        <h2 className="text-xl font-bold mb-2">Wallet Disconnected</h2>
                        <p className="text-slate-500 mb-6 max-w-sm">Please connect your MetaMask wallet to connect to the Polygon Amoy node and view real-time smart contract events.</p>
                        <Button onClick={() => open()} className="bg-purple-600 hover:bg-purple-700">Connect to Node</Button>
                    </div>
                ) : (
                    <div className="bg-white shadow-sm rounded-xl border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 border-b text-xs uppercase tracking-wider font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Cryptographic Hash (Fingerprint)</th>
                                        <th className="px-6 py-4">Issuer Wallet</th>
                                        <th className="px-6 py-4 text-right">Blockchain Tx</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2 text-purple-600" />
                                                <p>Querying Polygon Blockchain...</p>
                                            </td>
                                        </tr>
                                    ) : assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                                No documents have been anchored to this smart contract yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map((asset, index) => (
                                            <tr key={index} className="border-b last:border-0 hover:bg-slate-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-600">
                                                        <Clock className="w-4 h-4 opacity-50" />
                                                        {new Date(asset.timestamp * 1000).toLocaleString()}
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
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                                        <span className="font-mono text-xs text-slate-600">
                                                            {asset.issuer.slice(0, 6)}...{asset.issuer.slice(-4)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <a
                                                        href={`https://amoy.polygonscan.com/tx/${asset.txHash}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition"
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
