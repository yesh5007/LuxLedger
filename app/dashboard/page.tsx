"use client"
import Link from "next/link";
import { LayoutDashboard, Loader2, ExternalLink, Clock, Fingerprint, CheckCircle2 } from "lucide-react";
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
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-0)' }}>
            <TopNav />

            <main className="flex-1 container max-w-5xl py-12">
                {/* Page header */}
                <div className="flex items-end justify-between mb-10 stagger-in" style={{ "--stagger": 0 } as React.CSSProperties}>
                    <div>
                        <p className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase mb-2">Your Wallet</p>
                        <h1 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-semibold tracking-[-0.03em] text-foreground">
                            Issuer Dashboard
                        </h1>
                    </div>
                    {isConnected && (
                        <button
                            onClick={() => address && fetchMyAssets(address)}
                            disabled={isLoading}
                            className="h-9 px-4 text-[13px] font-medium rounded-md border border-border text-foreground hover:bg-foreground/[0.04] transition-colors duration-150 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
                            Sync
                        </button>
                    )}
                </div>

                {!isConnected ? (
                    <div className="py-20 text-center stagger-in" style={{ "--stagger": 1 } as React.CSSProperties}>
                        <p className="text-muted-foreground mb-4">Connect your issuer wallet to view your transaction history.</p>
                        <button
                            onClick={() => open()}
                            className="h-10 px-5 text-[13px] font-semibold rounded-md text-primary-foreground transition-colors duration-150"
                            style={{ background: 'var(--accent-base)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-base)')}
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : (
                    <div className="stagger-in" style={{ "--stagger": 1 } as React.CSSProperties}>
                        {/* Stats strip */}
                        <div className="flex gap-8 mb-8 pb-8 border-b border-border">
                            <div>
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Documents Issued</span>
                                <p className="text-2xl font-semibold text-foreground mt-0.5 tabular" style={{ fontFamily: 'var(--font-display)' }}>
                                    {isLoading ? "—" : assets.length}
                                </p>
                            </div>
                            <div>
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Wallet</span>
                                <p className="text-[13px] font-mono text-muted-foreground mt-2">
                                    {address?.slice(0, 10)}…{address?.slice(-6)}
                                </p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="border border-border rounded-lg overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                            <table className="w-full text-[13px]">
                                <thead>
                                    <tr className="border-b border-border text-left" style={{ background: 'var(--surface-2)' }}>
                                        <th className="px-4 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Issued</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Document Fingerprint</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider text-right">Tx</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-16 text-center text-muted-foreground">
                                                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                                                Syncing…
                                            </td>
                                        </tr>
                                    ) : assets.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-16 text-center text-muted-foreground">
                                                <p className="mb-3">No documents issued from this wallet yet.</p>
                                                <Link href="/issuer">
                                                    <button
                                                        className="h-9 px-4 text-[13px] font-semibold rounded-md text-primary-foreground transition-colors duration-150"
                                                        style={{ background: 'var(--accent-base)' }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-base)')}
                                                    >
                                                        Issue Your First Document
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ) : (
                                        assets.map((asset, index) => (
                                            <tr key={index} className="border-b border-border/60 last:border-0 hover:bg-foreground/[0.02] transition-colors duration-100">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-medium text-foreground">
                                                        {new Date(asset.timestamp * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-muted-foreground/60 ml-2 text-[11px]">
                                                        {new Date(asset.timestamp * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <code className="text-[11px] font-mono text-foreground/80 select-all break-all">
                                                        {asset.dataHash}
                                                    </code>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Anchored
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                                    <a
                                                        href={`https://amoy.polygonscan.com/tx/${asset.txHash}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
                                                    >
                                                        View <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-4 font-mono">
                            {assets.length} record{assets.length !== 1 ? 's' : ''} · Filtered by your wallet
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
