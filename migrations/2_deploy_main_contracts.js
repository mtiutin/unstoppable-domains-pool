// migrations/2_deploy_box.js
const UnstoppableDomainsPool = artifacts.require('UnstoppableDomainsPool');
const UpgradeableBeacon = artifacts.require('UpgradeableBeacon');
const BeaconProxy = artifacts.require('BeaconProxy');
const UDRouter = artifacts.require('UDRouter');
const TestToken = artifacts.require('TestToken');

function toBN(number) {
  return web3.utils.toBN(number);
}

const decimals = toBN('10').pow(toBN('18'));

const { deployProxy } = require('@openzeppelin/truffle-upgrades');
 
module.exports = async function (deployer, network, accounts) {

  let testToken;
  let udPool;
  let udRouter;
  
  if(network == 'rinkeby'){
  
  }else if(network == 'ropsten'){
   
  } else if(network == 'test' || network =='mainnet'){
  
  }

  await deployer.deploy(UDRouter).then(function(instance){
    udRouter = instance;
  })
  console.log("udRouter = ",udRouter.address);
  await udRouter.initialize.sendTransaction(accounts[0]);

  await deployer.deploy(TestToken,"tUSDC","testUSDC token").then(function(instance){
    testToken = instance;
  })
  console.log("testToken = ",testToken.address);

  
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
  await udPool.initialize.sendTransaction(accounts[0],testToken.address);

  await udRouter.setUDPool.sendTransaction(udPool.address, {from: accounts[0]});
  
  
};