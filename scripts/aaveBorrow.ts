import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { ILendingPool } from "../typechain-types";
import { AggregatorV3Interface } from "./../typechain-types/AggregatorV3Interface";
import { DEPOSIT_AMOUNT, getWeth } from "./getWeth";

const WETH_TOKEN_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const DAI_TOKEN_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const PRICE_ORACLE_ADDRESS = "0xA50ba011c48153De246E5192C8f9258A2ba79Ca9";
const LENDING_POOL_ADDRESSES_PROVIDER_ADDRESS = "0xb53c1a33016b2dc2ff3653530bff1848a515c8c5";

const main = async () => {
    /* Depositing into Aave */
    // Get WETH to deposit into Aave
    await getWeth();
    const [deployer] = await ethers.getSigners();

    // Get the lendingPool from the LendingPoolAddressesProvider
    const lendingPool = await getLendingPool(deployer);
    console.log("LendingPool Address: " + lendingPool.address);

    // Approve the LendingPool contract to spend our WETH
    await approveErc20(WETH_TOKEN_ADDRESS, lendingPool.address, DEPOSIT_AMOUNT, deployer);

    // Desposit the WETH into the lendingPool
    console.log("Depositing WETH...");
    await lendingPool.deposit(WETH_TOKEN_ADDRESS, DEPOSIT_AMOUNT, deployer.address, 0);
    console.log("WETH deposited");

    /* Borrowing from Aave */
    // See how much we can borrow from Aave
    let { totalDebtETH, availableBorrowsETH } = await getBorrowUserData(lendingPool, deployer);

    // Get the price of DAI
    const daiPrice = await getDaiPrice();
    console.log("DAI price: " + daiPrice);

    // Get amount to borrow in DAI (95% of amount allowed)
    const amountDaiToBorrow = availableBorrowsETH
        .div(daiPrice)
        .mul(ethers.utils.parseEther("0.95"));
    console.log("Amount of DAI we can borrow: " + amountDaiToBorrow.toString());

    // Borrow DAI from the LendingPool
    console.log("Borrowing DAI...");
    await borrowDai(lendingPool, DAI_TOKEN_ADDRESS, amountDaiToBorrow, deployer);

    // See updated user information from Aave
    await getBorrowUserData(lendingPool, deployer);
};

const borrowDai = async (
    lendingPool: ILendingPool,
    daiAddress: string,
    amountDaiToBorrow: BigNumber,
    account: SignerWithAddress
) => {
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrow, 1, 0, account.address);
    await borrowTx.wait(1);
    console.log("Dai borrowed");
};

const getDaiPrice = async () => {
    // Using Aave price oracles (which rely on chainlink in the background)
    const priceOracleGetter = await ethers.getContractAt(
        "IPriceOracleGetter",
        PRICE_ORACLE_ADDRESS
    );
    return await priceOracleGetter.getAssetPrice(DAI_TOKEN_ADDRESS);

    // Using chainlink price feeds
    // const priceFeed = await ethers.getContractAt(
    //     "AggregatorV3Interface",
    //     "0x773616E4d11A78F511299002da57A0a94577F1f4"
    // );
    // return (await priceFeed.latestRoundData())[1];
};

const getBorrowUserData = async (lendingPool: ILendingPool, account: SignerWithAddress) => {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account.address);
    console.log("ETH deposited: " + totalCollateralETH);
    console.log("ETH borrowed: " + totalDebtETH);
    console.log("Available to borrow: " + availableBorrowsETH);
    return { totalDebtETH, availableBorrowsETH };
};

const getLendingPool = async (account: SignerWithAddress) => {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        LENDING_POOL_ADDRESSES_PROVIDER_ADDRESS,
        account
    );

    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account);

    return lendingPool;
};

const approveErc20 = async (
    erc20Address: string,
    spenderAddress: string,
    amountToSpend: BigNumber,
    account: SignerWithAddress
) => {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account);
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log("Token approved");
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
