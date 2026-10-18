// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Independent POIDH-inspired solo bounties. Creator judges proof; rewards are native BOT.
contract ProofBounty is ReentrancyGuard {
    struct Bounty {address creator; uint256 reward; uint64 deadline; bool closed; string title; string description; uint256 winningClaim;}
    struct Claim {address creator; string proofURI; string description;}
    uint256 public bountyCount;
    mapping(uint256=>Bounty) public bounties;
    mapping(uint256=>Claim[]) private claims;
    mapping(address=>uint256) public credit;
    event Created(uint256 indexed id,address indexed creator,uint256 reward);
    event Submitted(uint256 indexed id,uint256 indexed claimId,address indexed creator,string proofURI);
    event Awarded(uint256 indexed id,uint256 indexed claimId,address indexed winner,uint256 reward);
    event Cancelled(uint256 indexed id);
    function create(string calldata title,string calldata description,uint64 deadline) external payable returns(uint256 id) {
        require(msg.value>0&&bytes(title).length>0&&bytes(title).length<=120&&bytes(description).length<=2000,"invalid bounty");
        require(deadline>block.timestamp&&deadline<=block.timestamp+90 days,"invalid deadline");
        id=bountyCount++; bounties[id]=Bounty(msg.sender,msg.value,deadline,false,title,description,0); emit Created(id,msg.sender,msg.value);
    }
    function submit(uint256 id,string calldata proofURI,string calldata description) external {
        Bounty storage b=bounties[id];
        require(id<bountyCount&&!b.closed&&block.timestamp<b.deadline&&msg.sender!=b.creator,"closed or creator");
        require(bytes(proofURI).length>0&&bytes(proofURI).length<=500&&bytes(description).length<=2000,"invalid proof");
        uint256 claimId=claims[id].length; claims[id].push(Claim(msg.sender,proofURI,description)); emit Submitted(id,claimId,msg.sender,proofURI);
    }
    function award(uint256 id,uint256 claimId) external {
        Bounty storage b=bounties[id]; require(msg.sender==b.creator&&!b.closed,"not creator or closed");
        Claim storage c=claims[id][claimId]; b.closed=true; b.winningClaim=claimId; credit[c.creator]+=b.reward; emit Awarded(id,claimId,c.creator,b.reward);
    }
    function cancel(uint256 id) external {
        Bounty storage b=bounties[id]; require(msg.sender==b.creator&&!b.closed,"not creator or closed");
        require(claims[id].length==0||block.timestamp>=uint256(b.deadline)+7 days,"judging period");
        b.closed=true; credit[b.creator]+=b.reward; emit Cancelled(id);
    }
    function withdraw() external nonReentrant {
        uint256 amount=credit[msg.sender]; require(amount>0,"nothing due"); credit[msg.sender]=0;
        (bool ok,)=msg.sender.call{value:amount}(""); require(ok,"transfer failed");
    }
    function claimCount(uint256 id) external view returns(uint256){return claims[id].length;}
    function getClaim(uint256 id,uint256 claimId) external view returns(Claim memory){return claims[id][claimId];}
}
