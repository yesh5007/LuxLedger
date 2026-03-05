import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const config: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        amoy: {
            type: "http",
            url: "https://rpc-amoy.polygon.technology/",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: 80002,
        },
    },
};

export default config;
