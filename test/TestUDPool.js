const UnstoppableDomainsPool = artifacts.require("UnstoppableDomainsPool");
const BeaconProxy = artifacts.require("BeaconProxy");
const UpgradeableBeacon = artifacts.require("UpgradeableBeacon");
const UniswapUtil = artifacts.require('UniswapUtil');
const TestToken = artifacts.require('TestToken');
const UDRouter = artifacts.require('UDRouter');
const IRegistry = artifacts.require('IRegistry');
const FreeMinter = artifacts.require('IFreeMinter');
const EthCrypto = require("eth-crypto");

// const UniswapFactory = artifacts.require("@uniswap/v2-core/contracts/IUniswapV2Factory.sol");
// const UniswapRouter = artifacts.require("IUniswapV2Router02");
//const UniswapFactory = contract.fromArtifact('"@uniswap/v2-core/contracts/IUniswapV2Factory.sol"');

const { time, ether, expectRevert } = require('openzeppelin-test-helpers');
const BigDecimal = require('js-big-decimal');
const { assert, expect } = require('chai');
const { default: Resolution } = require('@unstoppabledomains/resolution');
const resolution = new Resolution();
const { deployProxy, upgradeProxy} = require('@openzeppelin/truffle-upgrades');
// const { accounts, contract } = require('@openzeppelin/test-environment');


function toBN(number) {
    return web3.utils.toBN(number);
}


function printEvents(txResult, strdata){
    console.log(strdata," events:",txResult.logs.length);
    for(var i=0;i<txResult.logs.length;i++){
        let argsLength = Object.keys(txResult.logs[i].args).length;
        console.log("Event ",txResult.logs[i].event, "  length:",argsLength);
        for(var j=0;j<argsLength;j++){
            if(!(typeof txResult.logs[i].args[j] === 'undefined') && txResult.logs[i].args[j].toString().length>0)
                console.log(">",i,">",j," ",txResult.logs[i].args[j].toString());
        }
    }

}

const decimals = toBN('10').pow(toBN('18'));

contract('UDPool', (accounts) => {

    




    // let buyRes = ocProtectionSeller.create.sendTransaction(unionDAIPoolETH.address,validTo, amount, strike, deadline,web3.utils.asciiToHex(message),web3.utils.asciiToHex(signature), {from: buyerAccount});

    const uniswapFactoryAddress = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
    const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const uniTokenAddress = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984';
    let daiTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const usdcTokenAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    // const daiTokenAddress = usdcTokenAddress;
    let daiDecimals;
    let assetDecimals;

    let mainAccount = accounts[0];

    let udRouter;
    let udPool;
    let basicToken;
    let adminAddress = mainAccount;


    before(async () => {
   
        assert.isAtLeast(accounts.length, 10, 'User accounts must be at least 10');

        udRouter = await UDRouter.deployed();
        console.log("udRouter = ", udRouter.address);

        let poolAddress = await udRouter.udPool.call();
        udPool = await UnstoppableDomainsPool.at(poolAddress);

        let basicTokenAddress = await udPool.getBasicToken.call();
        basicToken = await TestToken.at(basicTokenAddress);
    
    });


    it('should push liquidity into Pools', async () => {
        let depositAmount = toBN(100).mul(decimals);
        let balanceBefore = await basicToken.balanceOf.call(mainAccount);
        await basicToken.approve.sendTransaction(udPool.address, depositAmount, {from:mainAccount});
        let depositRes  = await udPool.deposit.sendTransaction(depositAmount, {from:mainAccount});
        console.log(`depositRes GasUsed: ${depositRes.receipt.gasUsed} `);

        let liquidity = await udPool.balanceOf.call(mainAccount);
        console.log("User liquidity ", liquidity.toString());
        let withdrawRes = await udPool.withdraw.sendTransaction(liquidity, {from: mainAccount});
        console.log(`withdrawRes GasUsed: ${withdrawRes.receipt.gasUsed} `);
        let balanceAfter = await basicToken.balanceOf.call(mainAccount);

        assert.equal(balanceAfter.toString(),balanceBefore.toString(),"Balances should match");

    });

    it('should rent domain', async () => {

        let rentPreriod = toBN(1*30*24*60*4);//1 month
        let rentPerBloc = await udPool.domainRentPerBlock.call();
        let rentPaymentAmt = rentPreriod.mul(rentPerBloc);

        let registryAddr = await udRouter.udRegistry.call();
        let registry = await IRegistry.at(registryAddr);
        let poolBalance = await registry.balanceOf.call(udPool.address);
        assert.equal(poolBalance.toString(),'2',"incorrect balance");

        
        let tokenID = '110338768019842421679919317810137434074751594351642569153399783902859600293709';
        
        await basicToken.approve.sendTransaction(udPool.address, rentPaymentAmt, {from:mainAccount});
        let rentRes  = await udPool.rentDomain.sendTransaction(rentPreriod, toBN(tokenID), "QmQwKeQWMcWrcAJVNe8hR5WUCB8myiuWidRnrP9b8KWtbU",  {from:mainAccount});
        console.log(`rentRes GasUsed: ${rentRes.receipt.gasUsed} `);
        printEvents(rentRes);


    });

 

});
