"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PenTool, CheckCircle2, X, ArrowRight } from "lucide-react";
import { hashStudentData } from "@/lib/privacy-utils";
import { attestOnChain } from "@/lib/services/blockchain-service";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { TopNav } from "@/components/ui/top-nav";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { extractMetadata, ExtractedMetadata } from "@/lib/services/metadata-extraction";

export default function IssuerPage() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [fileProcessed, setFileProcessed] = useState(false);

    const [formData, setFormData] = useState({
        ownerName: "",
        serialNumber: "",
        modelName: "",
        details: ""
    });

    const [isAttesting, setIsAttesting] = useState(false);
    const [attestResult, setAttestResult] = useState<{ success: boolean, txHash?: string, error?: string } | null>(null);

    const handleFileSelected = async (file: File) => {
        setIsProcessingFile(true);
        setFileProcessed(false);
        setAttestResult(null);

        try {
            const metadata = await extractMetadata(file);
            setFormData({
                ownerName: metadata.recipientName || "",
                serialNumber: metadata.recipientId || "",
                modelName: metadata.documentType || "",
                details: metadata.documentDescription || ""
            });
            setFileProcessed(true);
        } catch (error: any) {
            console.error("OCR failed:", error);
            alert(`Failed to extract details: ${error.message}\n\nYou can enter them manually.`);
            setFileProcessed(true);
        } finally {
            setIsProcessingFile(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleIssue = async () => {
        if (!isConnected) {
            alert("Please connect your wallet first.");
            return;
        }
        if (!formData.ownerName || !formData.serialNumber || !formData.modelName) {
            alert("Please fill out Owner Name, Serial Number, and Model Name.");
            return;
        }

        setIsAttesting(true);
        setAttestResult(null);

        try {
            const dataToHash = {
                ownerName: formData.ownerName.trim().toLowerCase(),
                serialNumber: formData.serialNumber.trim().toLowerCase(),
                modelName: formData.modelName.trim().toLowerCase()
            };

            // @ts-ignore - bypassing the strict PrivateStudentData interface for the real Asset schema
            const documentHash = hashStudentData(dataToHash);
            const metadataURI = `ipfs://luxledger-demo-${Date.now()}`;
            const result = await attestOnChain(documentHash, metadataURI);
            setAttestResult(result);
        } catch (error: any) {
            setAttestResult({ success: false, error: error.message || "Failed to mint attestation." });
        } finally {
            setIsAttesting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-0)' }}>
            <TopNav />

            <main className="flex-1 container max-w-5xl py-12">
                {/* Page header */}
                <div className="mb-10 stagger-in" style={{ "--stagger": 0 } as React.CSSProperties}>
                    <p className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase mb-2">Issuer Portal</p>
                    <h1 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-semibold tracking-[-0.03em] text-foreground">
                        Register an Asset
                    </h1>
                </div>

                <div className="grid md:grid-cols-[1fr_280px] gap-12">
                    {/* Left — main form area */}
                    <div className="space-y-8 stagger-in" style={{ "--stagger": 1 } as React.CSSProperties}>

                        {/* Step 1: Upload */}
                        <section>
                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-[11px] font-mono font-semibold text-muted-foreground">01</span>
                                <h2 className="text-lg font-semibold tracking-tight text-foreground">Scan Document</h2>
                            </div>
                            <FileDropZone
                                onFileSelected={handleFileSelected}
                                accept="image/*,application/pdf"
                                maxSizeMB={10}
                            />
                            {isProcessingFile && (
                                <div className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Extracting with Gemini 2.5 Flash…
                                </div>
                            )}
                        </section>

                        {/* Step 2: Review */}
                        <section>
                            <div className="flex items-baseline gap-3 mb-4">
                                <span className="text-[11px] font-mono font-semibold text-muted-foreground">02</span>
                                <h2 className="text-lg font-semibold tracking-tight text-foreground">Review Details</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="ownerName" className="text-[12px] font-medium text-muted-foreground">Owner / Dealer</Label>
                                        <Input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="e.g. Vintage Watches Ltd" className="h-9 text-[13px]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="serialNumber" className="text-[12px] font-medium text-muted-foreground">Serial Number</Label>
                                        <Input id="serialNumber" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} placeholder="e.g. SN-89102-X" className="h-9 text-[13px] font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="modelName" className="text-[12px] font-medium text-muted-foreground">Model / Item</Label>
                                    <Input id="modelName" name="modelName" value={formData.modelName} onChange={handleInputChange} placeholder="e.g. Rolex Submariner Date" className="h-9 text-[13px]" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="details" className="text-[12px] font-medium text-muted-foreground">Details</Label>
                                    <Input id="details" name="details" value={formData.details} onChange={handleInputChange} placeholder="e.g. Oystersteel, Black Dial, 2024" className="h-9 text-[13px]" />
                                </div>
                            </div>
                        </section>

                        {/* Result */}
                        {attestResult && (
                            <div className={`p-4 rounded-lg border text-[13px] ${
                                attestResult.success
                                    ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-400'
                                    : 'border-red-500/30 bg-red-500/[0.06] text-red-700 dark:text-red-400'
                            }`}>
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    {attestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    {attestResult.success ? 'Registered on-chain' : 'Registration failed'}
                                </div>
                                {attestResult.success ? (
                                    <p className="text-[11px] font-mono opacity-80 break-all">
                                        TX: <a href={`https://amoy.polygonscan.com/tx/${attestResult.txHash}`} target="_blank" rel="noreferrer" className="underline">{attestResult.txHash}</a>
                                    </p>
                                ) : (
                                    <p className="text-[12px] opacity-80">{attestResult.error}</p>
                                )}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleIssue}
                            disabled={isAttesting || !isConnected || !formData.serialNumber}
                            className="w-full h-11 rounded-lg text-[14px] font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'var(--accent-base)' }}
                            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-hover)' }}
                            onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-base)' }}
                        >
                            {isAttesting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Mining Transaction…</>
                            ) : (
                                <><PenTool className="w-4 h-4" /> Issue Certificate</>
                            )}
                        </button>

                        {!isConnected && (
                            <p className="text-[12px] text-muted-foreground text-center">
                                Connect your wallet to sign and broadcast.
                            </p>
                        )}
                    </div>

                    {/* Right sidebar — no card, just content */}
                    <aside className="hidden md:block stagger-in" style={{ "--stagger": 2 } as React.CSSProperties}>
                        <div className="sticky top-20">
                            <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase mb-5">Process</p>
                            <div className="space-y-6">
                                {[
                                    { num: "01", title: "AI Extraction", desc: "Gemini reads every field from your uploaded document." },
                                    { num: "02", title: "Local Hashing", desc: "Data is normalized and SHA-256 hashed on your device. Nothing raw leaves the browser." },
                                    { num: "03", title: "Blockchain Anchor", desc: "Sign a transaction to store the hash on Polygon Amoy — permanently." }
                                ].map(step => (
                                    <div key={step.num}>
                                        <span className="text-[11px] font-mono font-semibold text-muted-foreground">{step.num}</span>
                                        <h4 className="text-[14px] font-semibold text-foreground mt-0.5 mb-1">{step.title}</h4>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
