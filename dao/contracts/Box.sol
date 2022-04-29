// contracts/Box.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Box is Ownable {
  uint256 private size = 100;
  string private color = "blue";

  event SizeChanged(uint256 newSize);
  event ColorChanged(string newColor);

  // Stores a new size in the contract
  function setSize(uint256 newValue) public onlyOwner {
    size = newValue;
    emit SizeChanged(newValue);
  }

  // Reads the last stored size
  function getSize() public view returns (uint256) {
    return size;
  }

  // Stores a new color in the contract
  function setColor(string memory newColor) public onlyOwner {
    color = newColor;
    emit ColorChanged(newColor);
  }

  // Reads the last stored size
  function getColor() public view returns (string memory) {
    return color;
  }
}
