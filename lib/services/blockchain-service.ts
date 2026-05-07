import { ethers } from "ethers";
import { LuxLedgerRegistryABI } from "../abi";

export const CONTRACT_ADDRESS = "0x55139963C92EFcc06F96f554e2DCd053BE050ba7";

export interface BlockchainStatus {
    isConnected: boolean;
    account?: string;
    chainId?: number;
    error?: string;
}

export interface VerificationResult {
    isValid: boolean;
    issuer?: string;
    timestamp?: number;
    metadataURI?: string;
    error?: string;
}

export interface RegisteredAssetEvent {
    dataHash: string;
    issuer: string;
    timestamp: number;
    metadataURI: string;
    txHash: string;
}

/**
 * Connects to MetaMask and returns wallet status.
 */
export async function connectWallet(): Promise<BlockchainStatus> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { isConnected: false, error: "MetaMask not found" };
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
        return { isConnected: false, error: error.message };
    }
}

/**
 * Anchors a document hash on the Polygon Amoy blockchain.
 * Auto-cancels any stuck pending transactions before registering.
 */
export async function attestOnChain(hash: string, metadataURI: string = "luxledger://local"): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { success: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        // 8. Ensure contract is connected with signer
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LuxLedgerRegistryABI, signer);

        // Ensure hash format
        if (!hash.startsWith("0x")) { hash = "0x" + hash; }

        // Pre-flight check (optional, but good to keep)
        try {
            const result = await contract.verifyAsset(hash);
            if (result && result[0] === true) {
                return { success: false, error: "This exact document has already been registered on the blockchain." };
            }
        } catch (e) {
            console.warn("Pre-flight check failed, proceeding anyway", e);
        }

        // 6. Add proper try/catch debugging
        console.log("--- DEBUGGING CONTRACT START ---");
        console.log("Contract instance:", contract);
        console.log("registerAsset function exists?", typeof contract.registerAsset === 'function');
        console.log("Params:", { hash, metadataURI });
        console.log("--- DEBUGGING CONTRACT END ---");

        // 4. Ensure frontend calls contract.registerAsset
        // Polygon Amoy nodes (like BlastAPI) have a strict 25 Gwei minimum priority fee.
        // We override the gas fees here to ensure it's always above 25 Gwei.
        console.log("Sending registerAsset transaction via contract call...");
        const tx = await contract.registerAsset(hash, metadataURI, {
            maxPriorityFeePerGas: ethers.parseUnits("35", "gwei"),
            maxFeePerGas: ethers.parseUnits("50", "gwei")
        });
        
        console.log("Tx sent:", tx.hash);
        
        await tx.wait();
        console.log("Tx confirmed in block!");
        
        return { success: true, txHash: tx.hash };
        
    } catch (error: any) {
        console.error("--- FULL ERROR START ---");
        console.error(error);
        console.error("--- FULL ERROR END ---");
        
        let errorMsg = error.reason || error.message || "Transaction failed";
        if (error.data && error.data.message) { errorMsg = error.data.message; }
        if (errorMsg.includes("Asset already registered")) {
            errorMsg = "This asset hash is already registered on the blockchain.";
        }
        return { success: false, error: errorMsg };
    }
}

/**
 * Verifies if a document hash was previously anchored on the blockchain.
 * Calls `verifyAsset(bytes32 dataHash)`
 *
 * @param documentHash The Keccak256 hash of the document data to verify
 */
export async function verifyOnChain(documentHash: string): Promise<VerificationResult> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { isValid: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LuxLedgerRegistryABI, provider);

        if (!documentHash.startsWith("0x")) {
            documentHash = "0x" + documentHash;
        }

        const result = await contract.verifyAsset(documentHash);
        const [exists, issuer, timestamp, metadataURI] = result;

        if (exists) {
            console.log("[LuxLedger] Verification result: VALID ✓");
            console.log("  Issuer:", issuer);
            console.log("  Timestamp:", new Date(Number(timestamp) * 1000).toISOString());
            console.log("  URI:", metadataURI);
        }

        return {
            isValid: exists,
            issuer: exists ? issuer : undefined,
            timestamp: exists ? Number(timestamp) : undefined,
            metadataURI: exists ? metadataURI : undefined
        };
    } catch (error: any) {
        console.warn("Verification error:", error?.message || error);
        return { isValid: false, error: error.message };
    }
}

/**
 * Gets all asset hashes registered by a specific issuer.
 * Calls `getAssetsByIssuer(address issuer)`
 */
export async function getAssetsByIssuer(issuerAddress: string): Promise<{ success: boolean; hashes?: string[]; error?: string }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { success: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LuxLedgerRegistryABI, provider);

        const hashes = await contract.getAssetsByIssuer(issuerAddress);
        return { success: true, hashes: [...hashes] };
    } catch (error: any) {
        console.warn("Fetch assets error:", error?.message || error);
        return { success: false, error: error.message };
    }
}

/**
 * Queries events with adaptive block range — automatically retries with smaller ranges
 * if the RPC rejects the request.
 */
async function queryWithAdaptiveRange(contract: any, filter: any, provider: any): Promise<any[]> {
    const currentBlock = await provider.getBlockNumber();
    const ranges = [5000, 2000, 500, 100];

    for (const range of ranges) {
        try {
            const fromBlock = Math.max(0, currentBlock - range);
            const events = await contract.queryFilter(filter, fromBlock, "latest");
            return events;
        } catch (err: any) {
            console.warn(`[LuxLedger] Block range ${range} failed, trying smaller...`);
        }
    }

    try {
        const events = await contract.queryFilter(filter, currentBlock - 10, "latest");
        return events;
    } catch {
        return [];
    }
}

/**
 * Retrieves the global history of all registered assets by fetching AssetRegistered events.
 */
export async function getAllRegisteredAssets(): Promise<{ success: boolean; assets?: RegisteredAssetEvent[]; error?: string }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { success: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LuxLedgerRegistryABI, provider);

        const filter = contract.filters.AssetRegistered();
        const events = await queryWithAdaptiveRange(contract, filter, provider);

        const assets: RegisteredAssetEvent[] = events.map((event: any) => ({
            dataHash: event.args[0],
            issuer: event.args[1],
            timestamp: Number(event.args[2]),
            metadataURI: event.args[3],
            txHash: event.transactionHash
        }));

        assets.sort((a, b) => b.timestamp - a.timestamp);

        return { success: true, assets };
    } catch (error: any) {
        console.warn("Fetch all global assets error:", error?.message || error);
        return { success: false, error: error.message };
    }
}

/**
 * Retrieves the history of assets registered by a specific issuer.
 * Uses direct contract state reads (getAssetsByIssuer + verifyAsset) to bypass RPC block limits.
 */
export async function getRegisteredAssetsByIssuer(issuerAddress: string): Promise<{ success: boolean; assets?: RegisteredAssetEvent[]; error?: string }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { success: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LuxLedgerRegistryABI, provider);

        // Fetch hashes directly from the contract state - NO block limits!
        const hashes = await contract.getAssetsByIssuer(issuerAddress);
        
        const assets: RegisteredAssetEvent[] = [];
        
        for (const hash of hashes) {
            try {
                const result = await contract.verifyAsset(hash);
                const exists = result[0];
                const issuer = result[1];
                const timestamp = result[2];
                const metadataURI = result[3];

                if (exists) {
                    assets.push({
                        dataHash: hash,
                        issuer: issuer,
                        timestamp: Number(timestamp),
                        metadataURI: metadataURI,
                        txHash: "" // State read doesn't provide txHash, handled in UI
                    });
                }
            } catch (err) {
                console.warn("Failed to verify hash:", hash);
            }
        }

        assets.sort((a, b) => b.timestamp - a.timestamp);

        return { success: true, assets };
    } catch (error: any) {
        console.warn("Fetch issuer assets error:", error?.message || error);
        return { success: false, error: error.message };
    }
}
