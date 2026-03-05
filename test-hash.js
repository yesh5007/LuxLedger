const { ethers } = require("ethers");

// Test the bug
const issuerData = { ownerName: "vinayek s", serialNumber: "2k2zo", modelName: "certificate" };
// Verifier might construct it in a different order implicitly during object spread/assignment
const verifierData = { modelName: "certificate", ownerName: "vinayek s", serialNumber: "2k2zo" };

function hashLikeIssuer(data) {
    const sortedKeys = Object.keys(data).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        sortedObj[key] = data[key];
    }
    const str = JSON.stringify(sortedObj);
    console.log("Issuer String:", str);
    return ethers.sha256(ethers.toUtf8Bytes(str));
}

function hashLikeVerifier(data) {
    const sortedKeys = Object.keys(data).sort();
    const sortedObj = {};
    for (const key of sortedKeys) {
        sortedObj[key] = data[key];
    }
    const str = JSON.stringify(sortedObj);
    console.log("Verifier String:", str);
    return ethers.sha256(ethers.toUtf8Bytes(str));
}

const hash1 = hashLikeIssuer(issuerData);
const hash2 = hashLikeVerifier(verifierData);

console.log("Issuer Hash:  ", hash1);
console.log("Verifier Hash:", hash2);
console.log("MATCH:", hash1 === hash2);
