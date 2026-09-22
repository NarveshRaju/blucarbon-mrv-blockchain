// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Testnet demo tokens; not certified carbon credits.
contract BlueCarbonToken is ERC20, Ownable {
    mapping(bytes32 => bool) public projectMinted;
    event ApprovalRecord(string indexed offChainProjectId, address indexed recipient, uint256 amountMinted);

    constructor(address initialOwner) ERC20("Blue Carbon Demo Token", "BCT") Ownable(initialOwner) {}

    function mintAndRecordApproval(address recipient, uint256 amount, string calldata offChainProjectId)
        external onlyOwner
    {
        require(bytes(offChainProjectId).length > 0, "Project ID required");
        require(amount > 0, "Positive amount required");
        bytes32 projectKey = keccak256(bytes(offChainProjectId));
        require(!projectMinted[projectKey], "Project already minted");
        projectMinted[projectKey] = true;
        _mint(recipient, amount);
        emit ApprovalRecord(offChainProjectId, recipient, amount);
    }
}
