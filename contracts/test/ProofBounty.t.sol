// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {Test} from "forge-std/Test.sol";
import {ProofBounty} from "../src/ProofBounty.sol";

contract ProofBountyTest is Test {
    address alice=address(0xA11CE);address bob=address(0xB0B);address treasury=address(0x777);
    function setUp() public {vm.deal(alice,100 ether);vm.deal(bob,100 ether);vm.deal(address(this),100 ether);}
    function test_bountyAwardAndWithdraw() public {
        ProofBounty p=new ProofBounty();vm.prank(alice);p.create{value:1 ether}("Take a picture","Proof required",uint64(block.timestamp+1 days));
        vm.prank(bob);p.submit(0,"https://example.com/photo.png","Photo proof");
        vm.prank(bob);vm.expectRevert();p.award(0,0);
        vm.prank(alice);vm.expectRevert();p.cancel(0);
        vm.prank(alice);p.award(0,0);assertEq(p.credit(bob),1 ether);
        vm.prank(bob);p.withdraw();assertEq(bob.balance,101 ether);
        vm.prank(bob);vm.expectRevert();p.withdraw();
    }
    function test_bountyRefundAfterJudgingWindow() public {
        ProofBounty p=new ProofBounty();vm.prank(alice);p.create{value:1 ether}("Task","Details",uint64(block.timestamp+1 days));
        vm.prank(bob);p.submit(0,"ipfs://proof","Evidence");vm.warp(block.timestamp+8 days);
        vm.prank(alice);p.cancel(0);vm.prank(alice);p.withdraw();assertEq(alice.balance,100 ether);
    }
}
