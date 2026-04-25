"use client"
import Link from "next/link";
import { CheckCircle, AlertTriangle, Loader2, FileText, ScanEye, Percent, ExternalLink, ArrowRight } from "lucide-react";
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
            setStep("OCR");
            const data = await extractMetadata(file);
            setMetadata(data);

            setStep("AI_CHECK");
            const forgery = await detectForgery(file);
            setForgeryResult(forgery);

            setStep("RESULTS");
        } catch (error) {
            console.error(error);
            alert("Analysis pipeline failed. See console.");
            setStep("UPLOAD");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVerifyOnChain = async () => {
        if (!metadata || !forgeryResult) return;
        if (forgeryResult.isForged) {
            alert("Blockchain verification blocked — document failed AI inspection.");
            return;
        }

        setIsVerifyingChain(true);
        try {
            const dataToHash = {
                ownerName: (metadata.recipientName || "").trim().toLowerCase(),
                serialNumber: (metadata.recipientId || "").trim().toLowerCase(),
                modelName: (metadata.documentType || "").trim().toLowerCase()
            };

            // @ts-ignore
            const hash = hashStudentData(dataToHash);
            const result = await verifyOnChain(hash);
            const isValid = result.isValid;
            setBlockchainStatus(isValid ? "VALID" : "INVALID");
            setVerificationData(isValid ? result : null);
            logVerificationAttempt(isValid ? "VALID" : "INVALID");
        } catch (error) {
            console.error(error);
            setBlockchainStatus("ERROR");
        } finally {
            setIsVerifyingChain(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-0)' }}>
            <TopNav />

            <main className="flex-1 container max-w-3xl py-12">
                {/* Page header */}
                <div className="mb-10 stagger-in" style={{ "--stagger": 0 } as React.CSSProperties}>
                    <p className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase mb-2">Verification</p>
                    <h1 className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-semibold tracking-[-0.03em] text-foreground">
                        Authenticate a Document
                    </h1>
                    <p className="text-[15px] text-muted-foreground mt-2 max-w-[55ch]">
                        AI forgery detection → metadata extraction → blockchain hash verification.
                    </p>
                </div>

                {step === "UPLOAD" || isProcessing ? (
                    <div className="stagger-in" style={{ "--stagger": 1 } as React.CSSProperties}>
                        {isProcessing ? (
                            <div className="py-20 text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground/40" />
                                <p className="text-[15px] font-medium text-foreground">
                                    {step === "OCR" && "Extracting metadata…"}
                                    {step === "AI_CHECK" && "Running forgery analysis…"}
                                </p>
                                <p className="text-[13px] text-muted-foreground mt-1">This may take a few seconds.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <FileDropZone onFileSelected={handleFileSelected} />
                                <button
                                    onClick={runAnalysisPipeline}
                                    disabled={!file}
                                    className="w-full h-11 rounded-lg text-[14px] font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ background: 'var(--accent-base)' }}
                                    onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-hover)' }}
                                    onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-base)' }}
                                >
                                    Start Verification <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8 stagger-in" style={{ "--stagger": 1 } as React.CSSProperties}>
                        {/* Results header */}
                        <div className="flex items-center justify-between pb-6 border-b border-border">
                            <h2 className="text-xl font-semibold tracking-tight text-foreground">Analysis Report</h2>
                            <button
                                onClick={() => { setStep("UPLOAD"); setFile(null); }}
                                className="h-8 px-3 text-[12px] font-medium rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] transition-colors duration-150"
                            >
                                New Scan
                            </button>
                        </div>

                        {/* Two-column results */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* AI Forgery */}
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <ScanEye className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Forgery Analysis</span>
                                </div>
                                {forgeryResult?.isForged ? (
                                    <div className="p-5 rounded-lg border border-red-500/30 bg-red-500/[0.06]">
                                        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mb-3" />
                                        <p className="text-[15px] font-semibold text-red-700 dark:text-red-400 mb-1">Forgery Detected</p>
                                        <p className="text-[13px] text-red-600/80 dark:text-red-400/80">{forgeryResult.reason}</p>
                                        <p className="text-[11px] font-mono text-red-600/60 dark:text-red-400/60 mt-3">Score: {forgeryResult.confidenceScore}</p>
                                    </div>
                                ) : (
                                    <div className="p-5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06]">
                                        <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-3" />
                                        <p className="text-[15px] font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Visually Authentic</p>
                                        <p className="text-[13px] text-emerald-600/80 dark:text-emerald-400/80">No pixel manipulation detected.</p>
                                        <p className="text-[11px] font-mono text-emerald-600/60 dark:text-emerald-400/60 mt-3">Confidence: {forgeryResult?.confidenceScore}</p>
                                    </div>
                                )}
                            </section>

                            {/* Metadata */}
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Extracted Data</span>
                                </div>
                                <div className="space-y-4 p-5 rounded-lg border border-border" style={{ background: 'var(--surface-2)' }}>
                                    {metadata?.ocrConfidence && (
                                        <div className="flex items-center justify-between pb-3 border-b border-border">
                                            <span className="text-[11px] text-muted-foreground uppercase font-medium">Confidence</span>
                                            <span className={`text-[11px] font-semibold font-mono ${metadata.ocrConfidence >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                {metadata.ocrConfidence}%
                                            </span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[11px] text-muted-foreground">Owner</span>
                                        <p className="text-[15px] font-medium text-foreground">{metadata?.recipientName || "—"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[11px] text-muted-foreground">Model</span>
                                            <p className="text-[13px] font-medium text-foreground">{metadata?.documentType || "—"}</p>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-muted-foreground">Serial</span>
                                            <p className="text-[13px] font-mono font-medium text-foreground">{metadata?.recipientId || "—"}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Blockchain verification */}
                        <section className="pt-6 border-t border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Blockchain Verification</span>
                            </div>

                            {forgeryResult?.isForged ? (
                                <div className="p-4 rounded-lg border border-border text-[13px] text-muted-foreground opacity-60" style={{ background: 'var(--surface-2)' }}>
                                    Blockchain access blocked — document failed forgery inspection.
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleVerifyOnChain}
                                        disabled={isVerifyingChain || blockchainStatus === "VALID"}
                                        className="w-full h-11 rounded-lg text-[14px] font-semibold text-primary-foreground flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ background: blockchainStatus === "VALID" ? 'var(--surface-2)' : 'var(--accent-base)' }}
                                        onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'var(--accent-hover)' }}
                                        onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = blockchainStatus === "VALID" ? 'var(--surface-2)' : 'var(--accent-base)' }}
                                    >
                                        {isVerifyingChain ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Querying Polygon…</>
                                        ) : blockchainStatus === "VALID" ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Hash Verified On-Chain</span>
                                        ) : (
                                            "Verify on Polygon"
                                        )}
                                    </button>

                                    {blockchainStatus === "VALID" && verificationData && (
                                        <div className="mt-4 p-5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] space-y-3">
                                            <p className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">Immutable proof found</p>
                                            <p className="text-[13px] text-emerald-600/80 dark:text-emerald-400/80">Document hash matches the on-chain record.</p>
                                            <div className="space-y-2 pt-3 border-t border-emerald-500/20">
                                                <div>
                                                    <span className="text-[11px] text-emerald-600/60 dark:text-emerald-400/60 uppercase font-medium">Issuer Wallet</span>
                                                    <p className="text-[12px] font-mono text-emerald-700 dark:text-emerald-400 break-all">{verificationData.issuer}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[11px] text-emerald-600/60 dark:text-emerald-400/60 uppercase font-medium">Timestamp</span>
                                                    <p className="text-[12px] text-emerald-700 dark:text-emerald-400">
                                                        {verificationData.timestamp ? new Date(verificationData.timestamp * 1000).toLocaleString() : "Unknown"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {blockchainStatus === "INVALID" && (
                                        <div className="mt-4 p-4 rounded-lg border border-red-500/30 bg-red-500/[0.06] text-center">
                                            <p className="text-[14px] font-semibold text-red-700 dark:text-red-400">Hash Mismatch</p>
                                            <p className="text-[13px] text-red-600/80 dark:text-red-400/80 mt-1">No matching record found on-chain. Document may be unregistered or forged.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
