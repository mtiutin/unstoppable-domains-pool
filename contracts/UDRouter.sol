// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract UDRouter is AccessControlUpgradeable{

  address public unstoppableDomainPool;
  
  function initialize(address admin) public initializer{
        __AccessControl_init();
        //access control initial setup
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
  }

  /**
  * @dev Throws if called by any account other than the one with the Admin role granted.
  */
  modifier onlyAdmin() {
      require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
      _;
  }

   function setUDPool(address _address) public onlyAdmin {
    unstoppableDomainPool = _address;
  }

  function udPool() public view returns (address){
    return unstoppableDomainPool;
  }
}
