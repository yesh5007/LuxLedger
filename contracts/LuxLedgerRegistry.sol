// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LuxLedgerRegistry
 * @notice On-chain registry for luxury asset authenticity certificates.
 *         Stores Keccak256 hashes of asset metadata, enabling tamper-proof verification.
 * @dev Deployed on Polygon Amoy testnet.
 */
contract LuxLedgerRegistry {
    struct Asset {
        bytes32 dataHash;
        address issuer;
        uint256 timestamp;
        string metadataURI;
        bool exists;
    }

    /// @notice Mapping from data hash to Asset record
    mapping(bytes32 => Asset) public assets;

    /// @notice Array of all registered data hashes (for enumeration)
    bytes32[] public allHashes;

    /// @notice Mapping from issuer address to their registered hashes
    mapping(address => bytes32[]) public issuerHashes;

    /// @notice Total number of assets registered
    uint256 public assetCount;

    /// @notice Emitted when a new asset is registered
    event AssetRegistered(
        bytes32 indexed dataHash,
        address indexed issuer,
        uint256 timestamp,
        string metadataURI
    );

    /**
     * @notice Register a new luxury asset on-chain.
     * @param dataHash Keccak256 hash of the asset's metadata (name, serial, model, etc.)
     * @param metadataURI Optional IPFS/Arweave URI pointing to full metadata
     */
    function registerAsset(bytes32 dataHash, string calldata metadataURI) external {
        require(!assets[dataHash].exists, "Asset already registered");

        assets[dataHash] = Asset({
            dataHash: dataHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            metadataURI: metadataURI,
            exists: true
        });

        allHashes.push(dataHash);
        issuerHashes[msg.sender].push(dataHash);
        assetCount++;

        emit AssetRegistered(dataHash, msg.sender, block.timestamp, metadataURI);
    }

    /**
     * @notice Verify if an asset hash exists on-chain.
     * @param dataHash The hash to look up
     * @return exists Whether the hash is registered
     * @return issuer The address that registered it
     * @return timestamp When it was registered
     * @return metadataURI The associated metadata URI
     */
    function verifyAsset(bytes32 dataHash) external view returns (
        bool exists,
        address issuer,
        uint256 timestamp,
        string memory metadataURI
    ) {
        Asset memory a = assets[dataHash];
        return (a.exists, a.issuer, a.timestamp, a.metadataURI);
    }

    /**
     * @notice Get all asset hashes registered by a specific issuer.
     * @param issuer The issuer address to query
     * @return hashes Array of data hashes registered by this issuer
     */
    function getAssetsByIssuer(address issuer) external view returns (bytes32[] memory) {
        return issuerHashes[issuer];
    }

    /**
     * @notice Get full asset details by hash.
     * @param dataHash The asset hash
     */
    function getAsset(bytes32 dataHash) external view returns (Asset memory) {
        return assets[dataHash];
    }
}
