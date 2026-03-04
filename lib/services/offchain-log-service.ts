
export interface VerificationLog {
    id: string;
    timestamp: number;
    transactionHash?: string;
    status: "VALID" | "INVALID" | "FORGED";
}

// Simulated in-memory database
// In a real microservices architecture, this would be a separate service (e.g., PostgreSQL or MongoDB)
// storing only non-sensitive logs.
const verificationLogs: VerificationLog[] = [];

/**
 * Logs a verification attempt.
 * STRICTLY NO PII STORED.
 */
export async function logVerificationAttempt(status: "VALID" | "INVALID" | "FORGED", txHash?: string) {
    const log: VerificationLog = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        status,
        transactionHash: txHash
    };
    verificationLogs.push(log);
    console.log("[Off-Chain Log] Verification attempt logged:", log);
    return log;
}

export async function getVerificationLogs() {
    return verificationLogs;
}
