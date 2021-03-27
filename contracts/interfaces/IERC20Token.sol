
// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

// import "https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/contracts/token/ERC20/IERC20Upgradeable.sol";

interface IERC20Token is IERC20Upgradeable{
    function decimals() external view returns (uint8);
}