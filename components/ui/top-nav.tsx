"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from 'wagmi';
import { ThemeToggle } from "@/components/theme-toggle";

export function TopNav() {
    const { open } = useWeb3Modal();
    const { address, isConnected } = useAccount();
    const pathname = usePathname();

    const links = [
        { href: "/", label: "Home" },
        { href: "/issuer", label: "Issue" },
        { href: "/verifier", label: "Verify" },
        { href: "/explorer", label: "Explorer" },
        { href: "/dashboard", label: "Dashboard" },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-border/60" style={{ background: 'var(--surface-0)', backdropFilter: 'blur(8px)' }}>
            <div className="container flex h-14 items-center justify-between">
                {/* Wordmark — no icon, just typography */}
                <Link href="/" className="flex items-center gap-0">
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.03em' }}>
                        Lux<span style={{ fontWeight: 700 }}>Ledger</span>
                    </span>
                </Link>

                {/* Navigation — left-aligned, understated */}
                <nav className="hidden md:flex items-center gap-1">
                    {links.map(({ href, label }) => {
                        const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
                        return (
                            <Link key={href} href={href}>
                                <button
                                    className={`
                                        px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors duration-150
                                        ${isActive
                                            ? 'bg-foreground/[0.06] text-foreground'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]'}
                                    `}
                                >
                                    {label}
                                </button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right side — wallet + theme */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {!isConnected ? (
                        <button
                            onClick={() => open()}
                            className="h-8 px-4 text-[13px] font-semibold rounded-md text-primary-foreground transition-colors duration-150"
                            style={{ background: 'var(--accent-base)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-base)')}
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-medium border border-border text-muted-foreground" style={{ background: 'var(--surface-2)' }}>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Amoy
                            </div>
                            <button
                                onClick={() => open()}
                                className="h-7 px-2.5 rounded-md text-[11px] font-mono font-medium border border-border text-foreground transition-colors duration-150 hover:bg-foreground/[0.04]"
                            >
                                {address?.slice(0, 6)}…{address?.slice(-4)}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
