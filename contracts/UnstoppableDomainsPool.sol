pragma solidity >=0.6.12;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./pool/PoolUpgradable.sol";
import "./libraries/SignLib.sol";


 
 contract UnstoppableDomainsPool 
    is 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    PoolUpgradable,
    SignLib
    {
   
    bytes32 public OPERATOR_ROLE;

    function initialize(address admin, address _basicToken) public initializer{
        __Pool_init(_basicToken,"Unstoppable domains liquidity pool");
        __AccessControl_init_unchained();
        __Pausable_init_unchained();
         //access control initial setup
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(OPERATOR_ROLE, admin);
    }

    /**
    * @dev Throws if called by any account other than the one with the Operator role granted.
    */
    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "Caller is not the Operator");
        _;
    }

    /**
    * @dev Throws if called by any account other than the one with the Admin role granted.
    */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }

    /**
    * set contract on hold. Paused contract doesn't accepts Deposits but allows to withdraw funds. 
     */
    function pause() onlyAdmin public {
        super._pause();
    }
    /**
    * unpause the contract (enable deposit operations)
     */
    function unpause() onlyAdmin public {
        super._unpause();
    }


    function _distributeProfit(uint256 profit) internal {


    }

    function getBasicToken() public  view returns (address){
        return address(basicToken);
    }
 
    // uint256 internal constant PRICE_DECIMALS = 1e8;
    function getBasicTokenDecimals() public  view returns (uint256){
        return 10**uint256(basicToken.decimals());
    }

    /**
    * returns total cap values for this contract: 
    * 1) totalCap value - total capitalization, including profits and losses, denominated in BasicTokens. i.e. total amount of BasicTokens that porfolio is worhs of.
    * 2) totalSupply of the TraderPool liquidity tokens (or total amount of trader tokens sold to Users). 
    * Trader token current price = totalCap/totalSupply;
    */
    function getTotalValueLocked() public view returns (uint256, uint256){
        return (totalCap, totalSupply());
    }

    function getPoolStat() public  view returns (uint256, uint256, uint256){
        uint256 profit = 0;
        return (totalCap,
                totalSupply(),
                profit
        );
    }

    function _beforeDeposit(uint256 amountTokenSent, address sender, address holder) internal virtual override {
        require(!paused(), "Cannot deposit when paused");
    }

    function _beforeWithdraw(uint256 amountLiquidity, address holder, address receiver) internal virtual override {
        require(!paused(), "Cannot withdraw when paused");
    } 

}
