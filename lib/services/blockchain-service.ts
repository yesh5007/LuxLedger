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
 * Anchors a document hash on the Polygon Amoy blockchain.
 * Calls `registerAsset(bytes32 dataHash, string metadataURI)`
 *
 * @param hash The Keccak256 hash of the document data (must start with 0x)
 * @param metadataURI Optional URI to off-chain document (IPFS/etc)
 */
export async function attestOnChain(hash: string, metadataURI: string = "luxledger://local"): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { success: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        const contract = new ethers.Contract(CONTRACT_ADDRESS, LuxLedgerRegistryABI, signer);

        // Ensure hash is bytes32 format (it comes from ethers.keccak256 so it should be)
        if (!hash.startsWith("0x")) {
            hash = "0x" + hash;
        }

        console.log("Sending transaction to registerAsset...");
        const tx = await contract.registerAsset(hash, metadataURI);
        console.log("Transaction sent:", tx.hash);

        await tx.wait();
        console.log("Transaction confirmed in block!");

        return { success: true, txHash: tx.hash };
    } catch (error: any) {
        console.error("Attestation deployment error:", error);
        // Better error message parsing for contract reverts
        let errorMsg = error.reason || error.message || "Transaction failed";
        if (error.data && error.data.message) {
            errorMsg = error.data.message;
        }
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
        console.error("Verification error:", error);
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
        console.error("Fetch assets error:", error);
        return { success: false, error: error.message };
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

        // We must bound the block query to prevent "request timed out" errors on public RPC nodes.
        // Polygon Amoy has 34+ million blocks. Querying from 0 is too heavy.
        // We will query the last 100,000 blocks (approx 2.5 days), which covers our recent tests.
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 100000);

        // Fetch all past AssetRegistered events
        const filter = contract.filters.AssetRegistered();
        const events = await contract.queryFilter(filter, fromBlock, "latest");

        const assets: RegisteredAssetEvent[] = events.map((event: any) => ({
            dataHash: event.args[0],
            issuer: event.args[1],
            timestamp: Number(event.args[2]),
            metadataURI: event.args[3],
            txHash: event.transactionHash
        }));

        // Sort by newest first
        assets.sort((a, b) => b.timestamp - a.timestamp);

        return { success: true, assets };
    } catch (error: any) {
        console.error("Fetch all global assets error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Retrieves the history of assets registered by a specific issuer by fetching AssetRegistered events.
 */
export async function getRegisteredAssetsByIssuer(issuerAddress: string): Promise<{ success: boolean; assets?: RegisteredAssetEvent[]; error?: string }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
        return { success: false, error: "Metamask not found" };
    }

    try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, LuxLedgerRegistryABI, provider);

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 100000);

        // Fetch past AssetRegistered events filtered by issuer
        const filter = contract.filters.AssetRegistered(null, issuerAddress);
        const events = await contract.queryFilter(filter, fromBlock, "latest");

        const assets: RegisteredAssetEvent[] = events.map((event: any) => ({
            dataHash: event.args[0],
            issuer: event.args[1],
            timestamp: Number(event.args[2]),
            metadataURI: event.args[3],
            txHash: event.transactionHash
        }));

        // Sort by newest first
        assets.sort((a, b) => b.timestamp - a.timestamp);

        return { success: true, assets };
    } catch (error: any) {
        console.error("Fetch issuer assets error:", error);
        return { success: false, error: error.message };
    }
}
