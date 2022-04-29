// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernanceToken is ERC20Votes {
  uint256 public s_maxSupply = 1_000_000 ether;
  address[] public shareholders;
  uint256 public shareholderCount;
  mapping(address => uint256) internal _shareholderIndices;

  constructor() ERC20("GovernanceToken", "GT") ERC20Permit("GovernanceToken") {
    shareholders.push(address(0)); // index 0 is unused
    _mint(msg.sender, s_maxSupply);
  }

  // The functions below are overrides required by Solidity.

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Votes) {
    super._afterTokenTransfer(from, to, amount);

    if (from != address(0) && balanceOf(from) == 0)
      _removeShareholder(from);

    if (to != address(0) && amount > 0)
      _addShareholder(to);
  }

  function _addShareholder(
    address sh
  ) internal virtual {
    uint256 index = _shareholderIndices[sh];
    if (index == 0) {
      shareholders.push(sh);
      _shareholderIndices[sh] = shareholders.length-1;
      shareholderCount++;
    }
  }

  function _removeShareholder(
    address sh
  ) internal virtual {
    uint256 len = shareholders.length;
    if (len > 0) {
      uint256 index = _shareholderIndices[sh];
      if (index != len-1)
        shareholders[index] = shareholders[len-1];
      shareholders.pop();
      shareholderCount--;
    }
  }

  function _mint(address to, uint256 amount) internal override(ERC20Votes) {
    super._mint(to, amount);
  }

  function _burn(address account, uint256 amount) internal override(ERC20Votes) {
    super._burn(account, amount);
  }
}
