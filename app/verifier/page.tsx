"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Upload, CheckCircle, AlertTriangle, Link as LinkIcon, Loader2, FileText, ScanEye, Percent } from "lucide-react";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount } from 'wagmi'
import { useState } from "react";
import { detectForgery, ForgeryAnalysisResult } from "@/lib/services/ai-forgery";
import { extractMetadata, ExtractedMetadata } from "@/lib/services/metadata-extraction";
import { verifyOnChain, VerificationResult } from "@/lib/services/blockchain-service";
import { logVerificationAttempt } from "@/lib/services/offchain-log-service";
import { hashStudentData } from "@/lib/privacy-utils";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { TopNav } from "@/components/ui/top-nav";

export default function VerifierPage() {
    const { open } = useWeb3Modal();
    const { address } = useAccount();

    const [file, setFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);
    const [forgeryResult, setForgeryResult] = useState<ForgeryAnalysisResult | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<"UPLOAD" | "OCR" | "AI_CHECK" | "RESULTS">("UPLOAD");

    // Blockchain Verification State
    const [isVerifyingChain, setIsVerifyingChain] = useState(false);
    const [blockchainStatus, setBlockchainStatus] = useState<"IDLE" | "VALID" | "INVALID" | "ERROR">("IDLE");
    const [verificationData, setVerificationData] = useState<VerificationResult | null>(null);

    const handleFileSelected = async (selectedFile: File) => {
        setFile(selectedFile);
        setMetadata(null);
        setForgeryResult(null);
        setStep("UPLOAD");
        setBlockchainStatus("IDLE");
        setVerificationData(null);
    };

    const runAnalysisPipeline = async () => {
        if (!file) return;
        setIsProcessing(true);
        setBlockchainStatus("IDLE");
        setVerificationData(null);

        try {
            // STEP 1: Metadata Extraction (OCR)
            setStep("OCR");
            const data = await extractMetadata(file);
            setMetadata(data);

            // STEP 2: AI Forgery Detection (Strict Scope)
            setStep("AI_CHECK");
            const forgery = await detectForgery(file);
            setForgeryResult(forgery);

            setStep("RESULTS");
        } catch (error) {
            console.error(error);
            alert("Analysis Pipeline Failed. See console.");
            setStep("UPLOAD");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyOnChain = async () => {
        if (!metadata || !forgeryResult) return;

        // STRICT RULE: If forged, do not proceed.
        if (forgeryResult.isForged) {
            alert("Security Protocol: Blockchain verification blocked due to detected forgery.");
            return;
        }

        setIsVerifyingChain(true);
        try {
            // Reconstruct Data for Hashing
            // These fields MUST match exactly what the Issuer used when registering (normalized, deterministic).
            const dataToHash = {
                ownerName: (metadata.recipientName || "").trim().toLowerCase(),
                serialNumber: (metadata.recipientId || "").trim().toLowerCase(),
                modelName: (metadata.documentType || "").trim().toLowerCase()
            };

            // @ts-ignore
            const hash = hashStudentData(dataToHash);
            console.log("Verifying Hash:", hash);

            // Verify: search attestation records for this document hash
            const result = await verifyOnChain(hash);
            const isValid = result.isValid;
            setBlockchainStatus(isValid ? "VALID" : "INVALID");
            setVerificationData(isValid ? result : null);

            // Log attempt off-chain (No PII)
            logVerificationAttempt(isValid ? "VALID" : "INVALID");

        } catch (error) {
            console.error(error);
            setBlockchainStatus("ERROR");
        } finally {
            setIsVerifyingChain(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <TopNav />

            <main className="flex-1 container py-12 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-4 font-serif">Luxury Asset Verification</h1>
                    <p className="text-muted-foreground">
                        Strict IEEE-aligned prototype. Step 1: Data Extraction. Step 2: AI Forgery Check. Step 3: Blockchain Hash Verification.
                    </p>
                </div>

                <div className="bg-white shadow-xl rounded-xl border overflow-hidden">
                    {step === "UPLOAD" || isProcessing ? (
                        <div className="p-12 flex flex-col items-center gap-8 min-h-[400px] justify-center">
                            {isProcessing ? (
                                <div className="text-center space-y-4">
                                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
                                    <h3 className="text-xl font-semibold">
                                        {step === "OCR" && "Extracting Metadata via OCR..."}
                                        {step === "AI_CHECK" && "AI Detecting Pixel Forgery..."}
                                    </h3>
                                    <p className="text-muted-foreground text-sm">Please wait while separate microservices process the document.</p>
                                </div>
                            ) : (
                                <>
                                    <FileDropZone
                                        onFileSelected={handleFileSelected}
                                        className="max-w-md w-full my-6 bg-white"
                                    />
                                    <Button size="lg" onClick={runAnalysisPipeline} disabled={!file} className="w-full max-w-sm">
                                        Start Verification Pipeline
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 space-y-8 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center justify-between border-b pb-6">
                                <h2 className="text-2xl font-bold">Analysis Report</h2>
                                <Button variant="outline" onClick={() => { setStep("UPLOAD"); setFile(null); }}>Scan New Document</Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Service 1: AI Forgery Detection */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <ScanEye className="h-4 w-4 text-purple-600" />
                                        <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">AI Forgery Service</h3>
                                    </div>

                                    {forgeryResult?.isForged ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                            <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                                            <h4 className="text-xl font-bold text-red-700">Digital Forgery Detected</h4>
                                            <p className="text-red-800 text-sm mt-2">{forgeryResult.reason}</p>
                                            <div className="mt-4 text-xs font-mono bg-red-100 p-1 rounded inline-block">
                                                Score: {forgeryResult.confidenceScore}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                                            <h4 className="text-xl font-bold text-green-700">Visually Authentic</h4>
                                            <p className="text-green-800 text-sm mt-2">No pixel manipulation detected.</p>
                                            <div className="mt-4 text-xs font-mono bg-green-100 p-1 rounded inline-block">
                                                Confidence: {forgeryResult?.confidenceScore}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Service 2: Metadata Extraction */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <h3 className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Metadata Service (OCR)</h3>
                                    </div>
                                    <div className="space-y-4 bg-slate-50 p-6 rounded-lg border">

                                        {/* OCR Confidence Badge */}
                                        {metadata?.ocrConfidence && (
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b">
                                                <span className="text-xs font-semibold text-slate-500 uppercase">Extraction Confidence</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center ${metadata.ocrConfidence >= 85 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                    <Percent className="w-3 h-3 mr-1" />
                                                    {metadata.ocrConfidence}%
                                                </span>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-xs text-slate-500">Asset Owner</label>
                                            <p className="font-medium text-lg">{metadata?.recipientName || "N/A"}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-slate-500">Model / Type</label>
                                                <p className="font-medium">{metadata?.documentType || "N/A"}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500">Serial Number</label>
                                                <p className="font-medium font-mono">{metadata?.recipientId || "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service 3: Blockchain Verification - Gated by AI Result */}
                            {forgeryResult?.isForged ? (
                                <div className="pt-6 border-t mt-4 opacity-50 grayscale cursor-not-allowed">
                                    <h3 className="font-semibold mb-2">Blockchain Verification</h3>
                                    <div className="bg-slate-100 p-4 rounded border text-slate-500 text-sm">
                                        🔒 Blockchain access blocked. Document failed AI forgery inspection.
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-6 border-t mt-4">
                                    <h3 className="font-semibold mb-4">Blockchain Authentication</h3>
                                    <div className="space-y-4">
                                        <Button
                                            onClick={handleVerifyOnChain}
                                            disabled={isVerifyingChain}
                                            variant={blockchainStatus === "VALID" ? "outline" : "default"}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        >
                                            {isVerifyingChain ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Querying Polygon Node...
                                                </>
                                            ) : blockchainStatus === "VALID" ? (
                                                <>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Hash Anchored On-Chain
                                                </>
                                            ) : (
                                                "Verify Truth on Polygon"
                                            )}
                                        </Button>
                                    </div>

                                    {blockchainStatus === "VALID" && (
                                        <div className="mt-4 p-5 bg-green-50 text-green-900 rounded-lg border border-green-200">
                                            <div className="text-center border-b border-green-200 pb-3 mb-3">
                                                <strong className="text-lg">✅ Immutable Proof Found</strong><br />
                                                <span className="text-sm">The document extraction matches the cryptographic hash stored on Polygon.</span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-green-700 text-xs font-bold uppercase">Anchored By (Issuer Wallet)</span>
                                                    <span className="font-mono break-all bg-white p-1 rounded mt-1 border border-green-100">{verificationData?.issuer}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-green-700 text-xs font-bold uppercase">Timestamp</span>
                                                    <span className="bg-white p-1 rounded mt-1 border border-green-100">
                                                        {verificationData?.timestamp ? new Date(verificationData.timestamp * 1000).toLocaleString() : "Unknown"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {blockchainStatus === "INVALID" && (
                                        <div className="mt-4 p-4 bg-red-50 text-red-800 rounded border border-red-200 text-center">
                                            <strong>❌ Hash Mismatch</strong><br />
                                            Data extraction does not match any anchored hash. Document may be fake or not yet registered.
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
