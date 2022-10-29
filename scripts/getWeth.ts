import { ethers } from "hardhat";

const DEPOSIT_AMOUNT = ethers.utils.parseEther("0.002");

export const getWeth = async () => {
    const [deployer] = await ethers.getSigners();
    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    );

    const tx = await iWeth.deposit({ value: DEPOSIT_AMOUNT });
    await tx.wait(1);

    const wethBalance = await iWeth.balanceOf(deployer.address);
    console.log("WETH Balance: " + wethBalance);
};
