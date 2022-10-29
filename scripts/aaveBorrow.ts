import { ethers } from "hardhat";
import { getWeth } from "./getWeth";

const main = async () => {
    await getWeth();
    const [deployer] = await ethers.getSigners();
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
