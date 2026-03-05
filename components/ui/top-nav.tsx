"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from 'wagmi';

export function TopNav() {
    const { open } = useWeb3Modal();
    const { address, isConnected } = useAccount();
    const pathname = usePathname();

    const NavLink = ({ href, label }: { href: string; label: string }) => {
        const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
        return (
            <Link href={href}>
                <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={isActive
                        ? "bg-purple-100/50 text-purple-700 font-bold tracking-wider border border-purple-200"
                        : "text-slate-500 font-bold tracking-wider hover:text-purple-600"}
                >
                    {label}
                </Button>
            </Link>
        );
    };

    return (
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
                    <NavLink href="/" label="HOME" />
                    <NavLink href="/issuer" label="ISSUE" />
                    <NavLink href="/verifier" label="VERIFY" />
                    <NavLink href="/explorer" label="EXPLORER" />
                    <NavLink href="/dashboard" label="DASHBOARD" />
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
                                Amoy Node Connected
                            </div>
                            <Button variant="outline" size="sm" onClick={() => open()} className="font-mono text-xs border-slate-200 shadow-sm text-slate-700">
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
