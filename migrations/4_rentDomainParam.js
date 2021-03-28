// migrations/2_deploy_box.js
const UnstoppableDomainsPool = artifacts.require('UnstoppableDomainsPool');
const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const BeaconProxy = artifacts.require('BeaconProxy');
const UDRouter = artifacts.require('UDRouter');
const TestToken = artifacts.require('TestToken');
const FreeMinter = artifacts.require('IFreeMinter');
const IRegistry = artifacts.require('IRegistry');
const { default: Resolution } = require('@unstoppabledomains/resolution');
const resolution = new Resolution();

function toBN(number) {
  return web3.utils.toBN(number);
}

const decimals = toBN('10').pow(toBN('18'));

const { deployProxy } = require('@openzeppelin/truffle-upgrades');

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
 
module.exports = async function (deployer, network, accounts) {

  let udRouter;

  let udPoolMaster;

  if(network == 'rinkeby' || network == 'rinkeby-fork'){
    udRouter = await UDRouter.at('0x299f94382345467d07471265F18c4eC412fd6352');
    await deployer.deploy(UnstoppableDomainsPool).then(function(){
      udPoolMaster = UnstoppableDomainsPool.address;
    })
    let udPoolBeacon = await UpgradeableBeacon.at('0x0A1f1557b8b4BB6dAc6fa353CC3c79c1c9688977');
    await udPoolBeacon.upgradeTo.sendTransaction(udPoolMaster);
  }else if(network == 'ropsten'){
   
  } else if(network == 'test' || network =='mainnet'){
    udRouter = await UDRouter.deployed();

  }

  let udPoolAddress = await udRouter.udPool.call();
  let udPool = await UnstoppableDomainsPool.at(udPoolAddress);

  //create couple addresses
  let unstoppableFreeMinterAddress  = await udRouter.udFreeMinter.call();
  let freeMinter = await FreeMinter.at(unstoppableFreeMinterAddress);
  // let mintRes1 = await freeMinter.claimTo.sendTransaction("hackathontest1",udPool.address);
  // await freeMinter.claimTo.sendTransaction("hackathontest2",udPool.address);
  // await freeMinter.claimTo.sendTransaction("hackathontest3",udPool.address);



  let testTokenAddress = await udPool.basicToken.call();
  let basicToken = await TestToken.at(testTokenAddress);
  console.log("testTokenAddress",testTokenAddress);

  let rentPreriod = toBN(1*30*24*60*4);//1 month
  let rentPerBloc = await udPool.domainRentPerBlock.call();
  let rentPaymentAmt = rentPreriod.mul(rentPerBloc);
  console.log("rentPaymentAmt",rentPaymentAmt.toString());
  console.log("accounts[0]=",accounts[0]);

  let registryAddr = await udRouter.udRegistry.call();
  let registry = await IRegistry.at(registryAddr);
  let poolBalance = await registry.balanceOf.call(udPool.address);
  

  let tokenIdStr = resolution.namehash('udtestdev-hackathontest3.crypto');

  console.log("balance ",(await basicToken.balanceOf.call(accounts[0])).toString());
  
  await basicToken.approve.sendTransaction(udPool.address, rentPaymentAmt, {from:accounts[0]});
  let rentRes  = await udPool.rentDomain.sendTransaction(rentPreriod, toBN(tokenIdStr), "QmQwKeQWMcWrcAJVNe8hR5WUCB8myiuWidRnrP9b8KWtbU",  {from:accounts[0]});
  console.log(`rentRes GasUsed: ${rentRes.receipt.gasUsed} `);
  printEvents(rentRes);

};