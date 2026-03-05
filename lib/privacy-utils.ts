import { ethers } from "ethers";

// Interface for the private student data that will be stored off-chain (e.g., Private Database or Encrypted IPFS)
export interface PrivateStudentData {
    recipientName: string;
    recipientEmail: string;
    recipientId: string;
    recipientWallet?: string;
    documentType: string;
    documentDescription: string;
    issuedAt: number;
}

/**
 * Hashes the private student data to create a unique "State Root" or "Fingerprint".
 * This hash is what gets stored on the Polygon zkEVM blockchain.
 * 
 * @param data The private student data object
 * @returns The SHA256 hash of the JSON string
 */
export function hashStudentData(data: PrivateStudentData): string {
    // 1. Sort keys to ensure consistent JSON stringification
    // We must manually sort and build the object to guarantee deterministic JSON output across all clients
    const sortedKeys = Object.keys(data).sort();
    const sortedObj: Record<string, any> = {};
    for (const key of sortedKeys) {
        // @ts-ignore
        sortedObj[key] = data[key];
    }
    const sortedData = JSON.stringify(sortedObj);

    // 2. Create a SHA256 hash of the stringified data
    // This ensures that even a single character change in the data will result in a completely different hash.
    const hash = ethers.sha256(ethers.toUtf8Bytes(sortedData));

    return hash;
}

/**
 * Verifies if a given data object matches the on-chain hash.
 * 
 * @param data The private student data provided by the user/verifier
 * @param onChainHash The hash retrieved from the Smart Contract
 * @returns True if the data is authentic and hasn't been tampered with
 */
export function verifyStudentData(data: PrivateStudentData, onChainHash: string): boolean {
    const calculatedHash = hashStudentData(data);
    return calculatedHash === onChainHash;
}
