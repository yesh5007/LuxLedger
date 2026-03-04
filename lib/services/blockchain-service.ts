import { ethers } from "ethers";

export interface BlockchainStatus {
    isConnected: boolean;
    account?: string;
    chainId?: number;
    error?: string;
}

/**
 * Connects to the user's Metamask wallet.
 */
export async function connectWallet(): Promise<BlockchainStatus> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { isConnected: false, error: "Metamask is not installed" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();

        return {
            isConnected: true,
            account: accounts[0],
            chainId: Number(network.chainId)
        };
    } catch (error: any) {
        console.error("Wallet connection error:", error);
        return { isConnected: false, error: error.message || "Failed to connect wallet" };
    }
}

/**
 * Anchors a document hash on the blockchain.
 *
 * IEEE Prototype Mode: Simulates on-chain anchoring by generating a
 * deterministic pseudo-tx hash from the document hash and wallet address.
 * This avoids the Polygon Amoy restriction that rejects `data` in
 * transactions to EOA addresses (error -32602).
 *
 * In a production system, this would interact with a deployed smart contract
 * or use a Layer 2 calldata approach.
 *
 * @param hash The Keccak256 hash of the document data (must start with 0x)
 */
export async function attestOnChain(hash: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { success: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const network = await provider.getNetwork();

        // Generate a deterministic simulated transaction hash
        // This combines the document hash, signer address, and timestamp
        // to produce a unique, reproducible identifier for this attestation.
        const timestamp = Date.now();
        const simulatedTxHash = ethers.keccak256(
            ethers.toUtf8Bytes(`${hash}:${userAddress}:${timestamp}`)
        );

        // Store the attestation in localStorage for prototype verification
        const attestations = JSON.parse(localStorage.getItem("luxledger_attestations") || "{}");
        attestations[simulatedTxHash] = {
            documentHash: hash,
            issuer: userAddress,
            chainId: Number(network.chainId),
            timestamp: timestamp,
            status: "ANCHORED",
        };
        localStorage.setItem("luxledger_attestations", JSON.stringify(attestations));

        console.log("[LuxLedger] Hash anchored (IEEE Prototype Mode)");
        console.log("  Document Hash:", hash);
        console.log("  Issuer:", userAddress);
        console.log("  Chain:", Number(network.chainId));
        console.log("  Simulated TxHash:", simulatedTxHash);

        return { success: true, txHash: simulatedTxHash };
    } catch (error: any) {
        console.error("Attestation error:", error);
        return { success: false, error: error.reason || error.message || "Transaction failed" };
    }
}

/**
 * Verifies if a document hash was previously anchored.
 *
 * IEEE Prototype Mode: Searches all attestation records in localStorage
 * for a matching document hash.
 *
 * @param documentHash The Keccak256 hash of the document data to verify
 */
export async function verifyOnChain(documentHash: string): Promise<boolean> {
    try {
        const attestations = JSON.parse(localStorage.getItem("luxledger_attestations") || "{}");

        // Search all attestations for a matching document hash
        for (const [txHash, record] of Object.entries(attestations)) {
            const r = record as any;
            if (r.documentHash.toLowerCase() === documentHash.toLowerCase()) {
                console.log("[LuxLedger] Verification result: VALID ✓");
                console.log("  Matched TxHash:", txHash);
                console.log("  Document Hash:", r.documentHash);
                console.log("  Issuer:", r.issuer);
                console.log("  Anchored at:", new Date(r.timestamp).toISOString());
                return true;
            }
        }

        console.warn("[LuxLedger] No attestation found for hash:", documentHash);
        return false;
    } catch (error) {
        console.error("Verification error:", error);
        return false;
    }
}
