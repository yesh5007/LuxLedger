"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, UserCircle2, Building2, FileSearch } from "lucide-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from 'wagmi'
import { TopNav } from "@/components/ui/top-nav";

export default function Home() {
  const { open } = useWeb3Modal();
  const { address } = useAccount();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <TopNav />

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4 font-serif">Immutable Proof of <span className="text-amber-600">Authenticity</span></h1>
          <p className="text-lg text-slate-600">
            Secure, AI-Augmented luxury asset verification on Polygon Layer 2. Select your role to continue.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Institution Card */}
          <Link href="/issuer" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-xl transition-all h-full flex flex-col items-center text-center cursor-pointer group-hover:border-amber-500/50">
              <div className="h-20 w-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="h-10 w-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 font-serif">I am a Brand / Boutique</h2>
              <p className="text-slate-500 mb-6">
                Issue new authenticity certificates, register assets, and attest hashes to the blockchain.
              </p>
              <Button className="mt-auto w-full bg-amber-600 hover:bg-amber-700">
                Login to Dashboard
              </Button>
            </div>
          </Link>

          {/* Verifier Card */}
          <Link href="/verifier" className="group">
            <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-xl transition-all h-full flex flex-col items-center text-center cursor-pointer group-hover:border-blue-500/50">
              <div className="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileSearch className="h-10 w-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2 font-serif">I want to Verify</h2>
              <p className="text-slate-500 mb-6">
                Upload an authenticity card or certificate to check for tampering and blockchain records.
              </p>
              <Button variant="outline" className="mt-auto w-full group-hover:border-blue-500 group-hover:text-blue-600">
                Verify Document
              </Button>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-xs text-slate-400 font-mono">
            Powered by Gemini 1.5 Flash • Polygon Amoy Testnet
          </p>
        </div>
      </main>
    </div>
  );
}
