pragma solidity >=0.6.12;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./pool/PoolUpgradable.sol";
import "./libraries/SignLib.sol";
import "../dot-crypto/contracts/IRegistry.sol";
import "../dot-crypto/contracts/IResolver.sol";


 
 contract UnstoppableDomainsPool 
    is 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    PoolUpgradable,
    SignLib,
    IERC721ReceiverUpgradeable
    {
   
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    // which can be also obtained as `IERC721Receiver(0).onERC721Received.selector`
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;

    IRegistry internal unstoppableDomainRegistry;

    uint256 public domainRentPerBlock;

    struct DomainRent{
        address renter;
        uint256 validTo;
    }

    mapping (uint256 => DomainRent) private domainRentRecords;

    event ChildSold(uint256 price, uint256 tokenID, uint256 parentTokenID, string uri);
    // event DomainSold(uint256 price, uint256 tokenID, uint256 parentTokenID, string uri);

    function initialize(address admin, address _basicToken, address _registry) public initializer{
        __Pool_init(_basicToken,"Unstoppable domains liquidity pool");
        __AccessControl_init_unchained();
        __Pausable_init_unchained();
         //access control initial setup
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(OPERATOR_ROLE, admin);

        unstoppableDomainRegistry = IRegistry(_registry);
        domainRentPerBlock = 5707762557077;//12 usd per year approx, assuming 18 decimals
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

    function setDomainRentPerBlock(uint256 _value) public onlyAdmin {
        domainRentPerBlock = _value;
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

    function buyChild(uint256 price, address to, uint256 tokenId, string calldata label) public {
        basicToken.safeTransferFrom(msg.sender, address(this), price);
        totalCap = totalCap.add(price);
        unstoppableDomainRegistry.mintChild(msg.sender, tokenId, label);
        uint256 childID = unstoppableDomainRegistry.childIdOf(tokenId, label);
        emit ChildSold(price, childID, tokenId, unstoppableDomainRegistry.tokenURI(childID));
    }

    function rentDomain(uint256 periodBlocks, uint256 tokenId, string calldata ipfsHashValue) public{
        require(unstoppableDomainRegistry.ownerOf(tokenId) == address(this), "not mine");
        //check existing domain rent (if any)
        bool canRent = domainRentRecords[tokenId].renter == address(0) || 
            domainRentRecords[tokenId].renter == msg.sender ||
            domainRentRecords[tokenId].renter != msg.sender && domainRentRecords[tokenId].validTo > block.number;

        if(canRent){
            uint256 rentFee = periodBlocks.mul(domainRentPerBlock);
            basicToken.safeTransferFrom(msg.sender, address(this), rentFee);
            totalCap = totalCap.add(rentFee);
            if(domainRentRecords[tokenId].renter == msg.sender){
                //extend rent
                domainRentRecords[tokenId].validTo = domainRentRecords[tokenId].validTo.add(periodBlocks);
            }
            else {
                domainRentRecords[tokenId] = DomainRent(msg.sender, block.number.add(periodBlocks));
            }
            //update domain key
            IResolver resolver = IResolver(unstoppableDomainRegistry.resolverOf(tokenId)); 
            resolver.set("ipfs.html.value", ipfsHashValue, tokenId);
        } else {
            require(false, "domain already rented by another party");
        }
    }

    function cancelRent(uint256 tokenId) public {
        require (unstoppableDomainRegistry.ownerOf(tokenId) == address(this), "not mine");
        require (domainRentRecords[tokenId].validTo > block.number, "can't cancel active rent");
        IResolver resolver = IResolver(unstoppableDomainRegistry.resolverOf(tokenId)); 
        resolver.set("ipfs.html.value", "", tokenId);
    }

    
    function testName(string memory label) public view returns(string memory){
        string memory DOMAIN_NAME_PREFIX = 'udtestdev-';
        string memory labelWithPrefix = string(abi.encodePacked(DOMAIN_NAME_PREFIX, label));
        return labelWithPrefix;
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data) public override returns (bytes4){
        return _ERC721_RECEIVED;
    }

    // function _beforeWithdraw(uint256 amountLiquidity, address holder, address receiver) internal virtual {
    //     require(false, "Withdrawing disabled");
    // }

    function _beforeDeposit(uint256 amountTokenSent, address sender, address holder) internal virtual override {
        require(!paused(), "Cannot deposit when paused");
    }

    function _beforeWithdraw(uint256 amountLiquidity, address holder, address receiver) internal virtual override {
        require(!paused(), "Cannot withdraw when paused");
    } 

}
