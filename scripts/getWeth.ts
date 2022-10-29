import { ethers } from "hardhat";

export const DEPOSIT_AMOUNT = ethers.utils.parseEther("0.1");

export const getWeth = async () => {
    const [deployer] = await ethers.getSigners();
    const weth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    );

    const tx = await weth.deposit({ value: DEPOSIT_AMOUNT });
    await tx.wait(1);

    const wethBalance = await weth.balanceOf(deployer.address);
    console.log("WETH Balance: " + wethBalance);
};
