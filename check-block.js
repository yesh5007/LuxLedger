const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
    const blockNumber = await provider.getBlockNumber();
    console.log("Current AMOY Block:", blockNumber);
}

main().catch(console.error);
