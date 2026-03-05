import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LuxLedgerRegistryModule", (m) => {
    const luxLedgerRegistry = m.contract("LuxLedgerRegistry");

    return { luxLedgerRegistry };
});
