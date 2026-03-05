"use client";

import React, { useState } from "react";
// Add Link import at the top if missing, though it's likely not. We will add it to the import list.
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, PenTool, CheckCircle2, X } from "lucide-react";
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

    // Extracted / Manual form data
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
            console.log("Extracting metadata with Gemini...");
            const metadata = await extractMetadata(file);
            console.log("Metadata extracted:", metadata);

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
            // Unlock the form so the user can enter details manually
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
            alert("Please connect your wallet first! We need it to sign the transaction.");
            return;
        }

        if (!formData.ownerName || !formData.serialNumber || !formData.modelName) {
            alert("Please ensure Owner Name, Serial Number, and Model Name are filled out.");
            return;
        }

        setIsAttesting(true);
        setAttestResult(null);

        try {
            // STEP 1: Hash the metadata locally (privacy-preserving)
            // CRITICAL: We only hash deterministic, normalized data so it can be perfectly re-created during verification.
            // Using a timestamp here would make it impossible for a Verifier to guess the exact millisecond to reproduce the hash.
            const dataToHash = {
                ownerName: formData.ownerName.trim().toLowerCase(),
                serialNumber: formData.serialNumber.trim().toLowerCase(),
                modelName: formData.modelName.trim().toLowerCase()
            };

            // @ts-ignore - bypassing the strict PrivateStudentData interface for the real Asset schema
            const documentHash = hashStudentData(dataToHash);
            console.log("Generated private hash:", documentHash);

            // STEP 2: Send hash to smart contract on Polygon Amoy
            // Using a dummy metadata URI for this demo
            const metadataURI = `ipfs://luxledger-demo-${Date.now()}`;
            console.log("Sending transaction to blockchain...");

            const result = await attestOnChain(documentHash, metadataURI);
            setAttestResult(result);
        } catch (error: any) {
            console.error(error);
            setAttestResult({ success: false, error: error.message || "Failed to mint attestation." });
        } finally {
            setIsAttesting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative pb-20">
            <TopNav />

            <main className="max-w-4xl mx-auto px-4 py-8 relative">

                {/* Intro */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold font-serif text-slate-900 mb-2">Issue Authenticity Certificate</h1>
                    <p className="text-slate-500">Upload an asset document. The AI will extract its details, and we will anchor an immutable hash of those details to Polygon Amoy.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Form */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Step 1: Upload */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center mb-4">
                                <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center mr-3">1</div>
                                <h2 className="text-lg font-semibold text-slate-800">Scan Asset Document</h2>
                            </div>

                            <FileDropZone
                                onFileSelected={handleFileSelected}
                                accept="image/*,application/pdf"
                                maxSizeMB={10}
                            />

                            {isProcessingFile && (
                                <div className="mt-4 flex items-center justify-center text-sm text-slate-500 bg-slate-50 py-3 rounded-lg border border-slate-100">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2 text-amber-500" />
                                    AI is reading document via Gemini Flash 2.0...
                                </div>
                            )}
                        </div>

                        {/* Step 2: Review Data */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-center mb-6">
                                <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center mr-3">2</div>
                                <h2 className="text-lg font-semibold text-slate-800">Review & Verify Details</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ownerName">Owner / Dealer Name</Label>
                                        <Input id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="e.g. Vintage Watches Ltd" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="serialNumber">Serial Number</Label>
                                        <Input id="serialNumber" name="serialNumber" value={formData.serialNumber} onChange={handleInputChange} placeholder="e.g. SN-89102-X" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="modelName">Model / Item Name</Label>
                                    <Input id="modelName" name="modelName" value={formData.modelName} onChange={handleInputChange} placeholder="e.g. Rolex Submariner Date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="details">Details / Specifications</Label>
                                    <Input id="details" name="details" value={formData.details} onChange={handleInputChange} placeholder="e.g. Oystersteel, Black Dial, 2024" />
                                </div>
                            </div>

                            {/* Attest Result Alert */}
                            {attestResult && (
                                <div className={`mt-6 p-4 rounded-lg border text-sm ${attestResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                    <div className="flex items-center mb-1">
                                        {attestResult.success ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                                        <span className="font-semibold">{attestResult.success ? 'Success! Asset Registered On-Chain.' : 'Registration Failed'}</span>
                                    </div>
                                    {attestResult.success ? (
                                        <div className="mt-2 text-xs opacity-90 font-mono break-all pl-6">
                                            TX: <a href={`https://amoy.polygonscan.com/tx/${attestResult.txHash}`} target="_blank" rel="noreferrer" className="underline hover:text-green-600">{attestResult.txHash}</a>
                                        </div>
                                    ) : (
                                        <div className="mt-1 pl-6 opacity-80">{attestResult.error}</div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                onClick={handleIssue}
                                disabled={isAttesting || !isConnected || !formData.serialNumber}
                                className="w-full mt-6 bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-medium"
                                size="lg"
                            >
                                {isAttesting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mining Transaction...
                                    </>
                                ) : (
                                    <>
                                        <PenTool className="mr-2 h-4 w-4" /> Issue Certificate (Polygon Amoy)
                                    </>
                                )}
                            </Button>

                            {!isConnected && (
                                <p className="text-center text-xs text-amber-600 mt-2 font-medium">
                                    ↑ Connect your wallet above to issue.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Helper / Sidebar */}
                    <div className="space-y-4">
                        <div className="p-5 bg-white rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-3">How it works</h3>
                            <ul className="text-sm text-slate-600 space-y-3">
                                <li className="flex gap-2">
                                    <div className="text-amber-500 font-bold">1</div>
                                    <div><strong className="text-slate-800 block">AI Extraction</strong> Upload an invoice or certificate. Gemini reads the details instantly.</div>
                                </li>
                                <li className="flex gap-2">
                                    <div className="text-amber-500 font-bold">2</div>
                                    <div><strong className="text-slate-800 block">Privacy Hashing</strong> Your data never touches the blockchain raw. It's hashed (SHA256) locally first.</div>
                                </li>
                                <li className="flex gap-2">
                                    <div className="text-amber-500 font-bold">3</div>
                                    <div><strong className="text-slate-800 block">On-Chain Anchoring</strong> A smart contract on Polygon Amoy stores the hash forever, proving ownership.</div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
