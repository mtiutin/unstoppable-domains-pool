// migrations/2_deploy_box.js
const UnstoppableDomainsPool = artifacts.require('UnstoppableDomainsPool');
const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const BeaconProxy = artifacts.require('BeaconProxy');
const UDRouter = artifacts.require('UDRouter');
const TestToken = artifacts.require('TestToken');
const FreeMinter = artifacts.require('IFreeMinter');

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

  let testToken;
  let udPool;
  let udRouter;

  let unstoppableRegistryAddress;
  let unstoppableFreeMinterAddress;
  
  
  if(network == 'rinkeby' || network == 'rinkeby-fork'){
    udRouter
    unstoppableRegistryAddress = '0xAad76bea7CFEc82927239415BB18D2e93518ecBB';
    unstoppableFreeMinterAddress = '0x84214215904cDEbA9044ECf95F3eBF009185AAf4';
  }else if(network == 'ropsten'){
   
  } else if(network == 'test' || network =='mainnet'){
    udRouter
    unstoppableRegistryAddress = '0xD1E5b0FF1287aA9f9A268759062E4Ab08b9Dacbe';
    unstoppableFreeMinterAddress = '0x1fC985cAc641ED5846b631f96F35d9b48Bc3b834';
  }

  await deployer.deploy(UDRouter).then(function(instance){
    udRouter = instance;
  })
  console.log("udRouter = ",udRouter.address);
  await udRouter.initialize.sendTransaction(accounts[0]);
  await udRouter.setUDRegistry.sendTransaction(unstoppableRegistryAddress, {from: accounts[0]});
  await udRouter.setUDFreeMinter.sendTransaction(unstoppableFreeMinterAddress, {from: accounts[0]});


  await deployer.deploy(TestToken,"testUSDC token","tUSDC2").then(function(instance){
    testToken = instance;
  })
  console.log("testToken = ",testToken.address);
  let users = ['0x5c29911512Cf706ce8a4FF32AA737b0fb055A733','0xb42c76567e0A1446B444E94657788Ba953D6fE66','0x6f663F1449bc69D90Bac69Eefcf8c25E957885aA','0x68A133aeEb048c687c2e82cFb7ed7CFCD138591c','0xff95a2f9bf8fe8019d1f705B5b1e3cb8a8F223C0','0xfBeB914c3C9B7a193C92De130A18716097478332','0xC3259EAB43474e8cE3330205251B6316914f1792'];
  let transferBalance = toBN(100000).mul(decimals);
  for(let i=0;i<users.length;i++){
    await testToken.transfer.sendTransaction(users[i],transferBalance);
  }
  
  await deployer.deploy(UnstoppableDomainsPool).then(function(){
    return UpgradeableBeacon.new(UnstoppableDomainsPool.address);
  }).then(function (Beacon){
    console.log ("UnstoppableDomainsPool Beacon:", Beacon.address);
    return BeaconProxy.new(Beacon.address, web3.utils.hexToBytes('0x'));
  }).then (function(BeaconProxy){
    return UnstoppableDomainsPool.at(BeaconProxy.address);
  }).then(function (instance){
    udPool = instance;
  });

  console.log ("UnstoppableDomainsPool Proxy Instance:", udPool.address);
  await udPool.initialize.sendTransaction(accounts[0],testToken.address, unstoppableRegistryAddress);

  await udRouter.setUDPool.sendTransaction(udPool.address, {from: accounts[0]});

  //create couple addresses

  let freeMinter = await FreeMinter.at(unstoppableFreeMinterAddress);
  let mintres0 = await freeMinter.claim.sendTransaction("hackathontest0.crypto");
  let mintRes1 = await freeMinter.claimTo.sendTransaction("hackathontest1.crypto",udPool.address);
  await freeMinter.claimTo.sendTransaction("hackathontest2.crypto",udPool.address);
  
  
};