"use client"
import Link from "next/link";
import { ArrowRight, Shield, Fingerprint, Lock } from "lucide-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from 'wagmi'
import { TopNav } from "@/components/ui/top-nav";
import { HeroCanvas } from "@/components/ui/hero-canvas";

export default function Home() {
  const { open } = useWeb3Modal();
  const { address } = useAccount();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-0)' }}>
      <TopNav />

      <main className="flex-1 flex flex-col">
        {/* ——— Hero section — split layout: text left, animation right ——— */}
        <section className="flex-1 flex items-center">
          <div className="container max-w-6xl py-16 md:py-0">
            <div className="grid md:grid-cols-[1fr_1fr] gap-8 md:gap-0 items-center min-h-[min(70vh,600px)]">

              {/* Left — editorial copy */}
              <div className="stagger-in" style={{ "--stagger": 0 } as React.CSSProperties}>
                <p className="text-[12px] font-semibold tracking-[0.15em] uppercase mb-5"
                   style={{ color: 'var(--accent-base)' }}>
                  Blockchain Verified
                </p>
                <h1 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-foreground mb-6">
                  Immutable proof<br />
                  <span className="text-muted-foreground">for luxury goods</span>
                </h1>
                <p className="text-[15px] text-muted-foreground leading-[1.7] max-w-[44ch] mb-8">
                  Upload a certificate. Our AI validates its integrity, extracts
                  every field, and anchors a cryptographic fingerprint to
                  Polygon — permanently.
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href="/issuer">
                    <button
                      className="h-11 px-6 text-[13px] font-semibold rounded-lg text-primary-foreground flex items-center gap-2 transition-all duration-200"
                      style={{ background: 'var(--accent-base)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent-base)')}
                    >
                      Issue Certificate
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href="/verifier">
                    <button className="h-11 px-6 text-[13px] font-semibold rounded-lg border border-border text-foreground hover:bg-foreground/[0.04] transition-colors duration-200">
                      Verify Document
                    </button>
                  </Link>
                </div>
                {/* Trust indicators — no cards, just text */}
                <div className="flex gap-6 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Polygon Amoy</span>
                  <span className="flex items-center gap-1.5"><Fingerprint className="w-3 h-3" /> SHA-256</span>
                  <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Client-Side Privacy</span>
                </div>
              </div>

              {/* Right — 3D canvas animation */}
              <div className="relative stagger-in hidden md:block" style={{ "--stagger": 1 } as React.CSSProperties}>
                <div className="aspect-square max-w-[480px] ml-auto">
                  <HeroCanvas className="w-full h-full" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ——— Process section — numbered, no cards ——— */}
        <section className="border-t border-border">
          <div className="container max-w-6xl py-20 md:py-24">
            <div className="grid md:grid-cols-[200px_1fr] gap-12">
              {/* Section label */}
              <div className="stagger-in" style={{ "--stagger": 2 } as React.CSSProperties}>
                <p className="text-[12px] font-semibold tracking-[0.15em] uppercase sticky top-20"
                   style={{ color: 'var(--accent-base)' }}>
                  How it works
                </p>
              </div>
              {/* Steps */}
              <div className="grid md:grid-cols-3 gap-x-12 gap-y-10">
                {[
                  {
                    num: "01",
                    title: "AI Extraction",
                    desc: "Upload an invoice or warranty card. Gemini 2.5 Flash reads every field with high-confidence OCR — owner, serial, model, date."
                  },
                  {
                    num: "02",
                    title: "Privacy Hashing",
                    desc: "Your data never leaves the browser raw. Fields are normalized and passed through SHA-256 locally before anything touches the chain."
                  },
                  {
                    num: "03",
                    title: "On-Chain Anchor",
                    desc: "Sign with your wallet. The hash is stored on Polygon Amoy — immutable, transparent, and verifiable by anyone with the original data."
                  }
                ].map((step, i) => (
                  <div key={step.num} className="stagger-in" style={{ "--stagger": i + 3 } as React.CSSProperties}>
                    <span className="text-[11px] font-mono font-semibold text-muted-foreground">{step.num}</span>
                    <h3 className="text-lg font-semibold tracking-tight mt-1.5 mb-2.5 text-foreground">{step.title}</h3>
                    <p className="text-[14px] text-muted-foreground leading-[1.65]">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ——— Stats / social proof strip ——— */}
        <section className="border-t border-border" style={{ background: 'var(--surface-2)' }}>
          <div className="container max-w-6xl py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "Polygon", label: "Network" },
                { value: "SHA-256", label: "Hash Algorithm" },
                { value: "Gemini 2.5", label: "AI Model" },
                { value: "< 2s", label: "Verification Time" },
              ].map((stat, i) => (
                <div key={stat.label} className="stagger-in" style={{ "--stagger": i + 6 } as React.CSSProperties}>
                  <p className="text-xl font-semibold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="container max-w-6xl py-6 flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
              LuxLedger
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Polygon Amoy Testnet · 2026
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
