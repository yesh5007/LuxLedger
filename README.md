# LuxLedger: A Verification-First Framework for Luxury Goods Authentication

## Abstract
Counterfeit products remain a persistent issue in the luxury goods resale market, where authenticity verification often depends on manual inspection or centralized digital records prone to manipulation. This repository contains the reference implementation of **LuxLedger**, a verification-first framework that converges multimodal Artificial Intelligence (AI) and distributed ledger technology to establish an immutable, cryptographically secure proof of authenticity for physical and digital luxury assets. 

By analyzing authenticity certificates for digital forgery prior to blockchain registration, the system addresses the "garbage-in, garbage-out" (GIGO) vulnerability inherent in traditional supply chain ledgers. 

## 1. System Architecture

The LuxLedger architecture is bifurcated into two primary workflows: **Issuance** and **Verification**. Both workflows function via a decentralized application (dApp) interface that securely orchestrates off-chain AI analysis and on-chain state anchoring.

### 1.1 Architecture Diagram

```mermaid
graph TD
    subgraph Client Application [Next.js Frontend]
        UI_Issuer[Issuer Portal]
        UI_Verifier[Verifier Portal]
        UI_Dashboard[Issuer Dashboard]
        UI_Explorer[Global Explorer Ledger]
    end

    subgraph Off-Chain AI Processing [Google Gemini 2.5 Flash]
        AI_OCR[OCR & Semantic Extraction]
        AI_Forensics[Forgery & Tamper Detection]
    end

    subgraph Cryptographic Layer
        SHA256[Deterministic SHA-256 Hashing]
    end

    subgraph On-Chain State [Polygon Amoy Testnet]
        SmartContract[LuxLedgerRegistry.sol]
    end

    % Issuance Flow
    UI_Issuer -- "1. Uploads Certificate" --> AI_OCR
    AI_OCR -- "2. Extracts Metadata" --> SHA256
    SHA256 -- "3. Generates Fingerprint" --> SmartContract

    % Verification Flow
    UI_Verifier -- "1. Uploads Certificate" --> AI_Forensics
    AI_Forensics -- "2. Validates Integrity" --> AI_OCR
    AI_OCR -- "3. Extracts Metadata" --> SHA256
    SHA256 -- "4. Generates Fingerprint" --> SmartContract
    SmartContract -- "5. Returns Proof of Existence" --> UI_Verifier

    % Global Ledger & Dashboard
    SmartContract -- "AssetRegistered Events" --> UI_Explorer
    SmartContract -- "Filtered Events by Wallet" --> UI_Dashboard
```

### 1.2 Technology Stack
*   **Frontend Application Layer:** Next.js 16 (React, TypeScript)
*   **Styling & UI:** Tailwind CSS and Shadcn UI
*   **Artificial Intelligence Engine:** Google Gemini 2.5 Flash API for OCR and Digital Forensics
*   **Cryptographic Hashing:** Ethers.js implementation of deterministic SHA-256 serialization
*   **Distributed Ledger Layer:** Polygon Amoy Testnet (EVM-compatible Layer 2)
*   **Web3 Integration:** Wagmi and Web3Modal

## 2. Methodology

### 2.1 The Issuance Protocol
The issuance protocol allows authorized entities to anchor a new asset to the blockchain. 
1.  A physical or digital authenticity certificate is uploaded.
2.  The Gemini 2.5 Flash AI model extracts critical parameters.
3.  The client normalizes this data utilizing deterministic alphabetical sorting and generates a privacy-preserving SHA-256 fingerprint.
4.  The authorized issuer utilizes their non-custodial wallet (e.g., MetaMask) to invoke the `registerAsset` function on the `LuxLedgerRegistry` smart contract.

### 2.2 The Verification Protocol
The verification protocol enables secondary market purchasers to mathematically validate an asset without relying on centralized databases.
1.  The verifying party uploads the authenticity document in question.
2.  The Gemini AI model executes a rigorous digital forensics prompt to distinguish standard digital generation artifacts from malicious cloning.
3.  If the document passes the forensic threshold, the AI extracts the metadata and the system recalculates the SHA-256 fingerprint deterministically.
4.  A read query is dispatched to the Polygon Amoy blockchain to cross-reference the hash against the `LuxLedgerRegistry`.

## 3. Code Structure

The repository is organized following standard Next.js and typical Web3 structures:

```text
LuxLedger/
├── app/                        # Next.js App Router root
│   ├── dashboard/page.tsx      # Connected wallet dashboard
│   ├── explorer/page.tsx       # Global asset ledger 
│   ├── issuer/page.tsx         # Document issuance portal
│   ├── verifier/page.tsx       # Document verification portal
│   ├── layout.tsx              # Root HTML + Universal Web3 Providers
│   └── page.tsx                # Landing Page
├── asset doc/                  # Generated dummy assets for testing
│   ├── generate_invoices.py    # Rolex PDF invoice synthesis script using reportlab
│   └── *.pdf                   # Synthesized Rolex invoices
├── components/
│   └── ui/                     # Reusable Shadcn + Tailwind UI Components (TopNav, Button, file-drop-zone)
├── contracts/
│   └── LuxLedgerRegistry.sol   # Solidity Smart Contract
├── lib/                        # Core backend services
│   ├── abi.ts                  # Smart Contract ABI definitions
│   ├── contract.ts             # Web3 Contract configurations
│   ├── privacy-utils.ts        # Deterministic JSON serialization and SHA-256 formulation
│   └── services/               # API integrators
│       ├── ai-forgery.ts       # Gemini API Forensic pipeline
│       ├── metadata-extraction.ts # Gemini API OCR pipeline
│       └── blockchain-service.ts  # ethers.js node connection protocols
├── README.md                   # Formal System Architecture Report
└── next.config.mjs             # Next.js framework configuration
```

## 4. Implementation Plan & Future Features

### Current State
*   [x] Smart Contract Anchoring on Polygon Amoy
*   [x] Gemini 2.5 Flash OCR and Forgery Detection Iteration
*   [x] Universal Dashboard and Explorer Ledger with specific Wallet filtering
*   [x] Procedural Synthesized Documents for Developer Testing (`asset doc`)

### Planned Features (Roadmap)
*   **Zero-Knowledge Proofs (ZKPs):** Transition toward decentralized metadata parsing using zk-SNARKs instead of centralized AI APIs to guarantee trustless execution.
*   **Batch Issuance Automation:** Implement optimized Merkle Trees off-chain to compress multiple documents into a single root hash, minimizing on-chain gas scaling costs.
*   **Revocation Authorities:** Upgrade the `LuxLedgerRegistry.sol` to allow specific credential invalidation (e.g., if a watch is reported stolen).
*   **Cross-Chain Interoperability:** Enable cross-validation via Chainlink CCIP mapping Polygon roots back to Ethereum Mainnet.

## 5. Installation and Deployment

### 5.1 Prerequisites
*   Node.js (v18.0.0 or higher)
*   Yarn package manager
*   A Google Cloud Platform (GCP) account with an active Gemini API key.
*   A Web3 wallet provisioned with Polygon Amoy testnet tokens.

### 5.2 Local Environment Setup

1.  Clone the repository and install all dependencies:
    ```bash
    yarn install
    ```

2.  Establish the environment configuration variables in the root directory:
    ```bash
    # .env.local
    NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
    NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
    ```

3.  Initialize the Next.js development server:
    ```bash
    yarn dev
    ```

## 6. License
This framework is presented for academic and developmental purposes.
