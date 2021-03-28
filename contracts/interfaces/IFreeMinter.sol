
// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;

interface IFreeMinter{
    function claim(string calldata label) external;
    function claimTo(string calldata label, address receiver) external;
}