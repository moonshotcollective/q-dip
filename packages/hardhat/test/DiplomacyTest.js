const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { asciiToHex } = require("web3-utils");

use(solidity);

describe("Quadratic Diplomacy", function () {

  describe("Diplomacy", function () {
    it("Should deploy Diplomacy", async function () {
      const Diplomacy = await ethers.getContractFactory("Diplomacy");
      diplomacy = await Diplomacy.deploy();
      // console.log(diplomacy)
    });

    describe("newElection()", function () {
      it("Should be able to create new election", async function () {
        await diplomacy.newElection(
          "Build #1", 
          4, 
          "0x0000000000000000000000000000000000000000", 
          10, 
          [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            // "0x01684C57AE8a4226271068210Ce1cCED865a5AfC",
            // "0xf5De4337Ac5332aF11BffbeC45D950bDDBc1493F",
            // "0x4E53E14de4e264AC2C3fF501ed3Bd6c4Ad63B9A1",
          ]
        );
      });
    });

    describe("castBallot()", function () {
      it("should be able to cast a ballot", async function () {
        await diplomacy.castBallot(
          0, 
          [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            // "0x01684C57AE8a4226271068210Ce1cCED865a5AfC",
            // "0xf5De4337Ac5332aF11BffbeC45D950bDDBc1493F",
            // "0x4E53E14de4e264AC2C3fF501ed3Bd6c4Ad63B9A1",
          ], 
          [
            "1", 
            // "2", 
            // "1", 
            // "0"
          ]
        );
      });
    });

    describe("endElection()", function () {
      it("should be able to end an election", async function () {
        await diplomacy.endElection(
          0
        )
      });
    });

    describe("payoutElection()", function () {
      it("should be able to payout an election", async function () {
        await diplomacy.payoutElection(
          0, 
          [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            // "0x01684C57AE8a4226271068210Ce1cCED865a5AfC",
            // "0xf5De4337Ac5332aF11BffbeC45D950bDDBc1493F",
            // "0x4E53E14de4e264AC2C3fF501ed3Bd6c4Ad63B9A1",
          ],  
          [
            1, 
            // "1", 
            // "1", 
            // "1"
          ], 
          {
            value: 4
          }
        )
      });
    }); 

  });
});
