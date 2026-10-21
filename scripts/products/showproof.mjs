import {parseEther} from 'viem';
export default {
 slug:'showproof',vercel:'showproofbot',assets:['BOT'],name:'Showproof',repo:'showproof',contract:'ShowproofBounty',color:'#b7d9ff',eyebrow:'PROOF BOUNTIES',symbol:'✓',
 line:'Post a bounty. Show the proof.',
 description:'BOT-funded tasks with public proof submissions and creator-selected payouts. Inspired by POIDH.',
 abis:['ShowproofBounty'],
 contracts:['src/ShowproofBounty.sol'],tests:['test/Showproof.t.sol'],
 landing:{
  steps:[['Fund a task','Describe what you need and lock a BOT reward in the contract.'],['Collect proof','Anyone submits a public image or IPFS link with a short description.'],['Pay the winner','You award one claim. The winner withdraws the BOT; nobody else can touch it.']],
  features:[['Escrowed rewards','The reward sits in the contract from the moment the bounty is posted.'],['Public proof','Every claim is recorded onchain with its proof link and author.'],['Fair cancellation','With claims pending, the creator can only cancel seven days after the deadline.'],['No protocol fee','Winners receive the full reward in native BOT.']],
  faq:[['Who decides the winner?','The bounty creator. There is no vote or arbitration, so check a creator\'s history before you work on their bounty.'],['Where are proofs stored?','Proof media is hosted wherever you choose (an image host or IPFS). Only the link and description go onchain.'],['Can a creator withdraw the reward?','Only by cancelling: immediately if nobody has submitted, or seven days after the deadline if they have.'],['What does it cost?','Only BOT Chain gas. Showproof takes no fee.']],
 },
 async deploy({deploy}){await deploy('ShowproofBounty');},
 async fork({c,write,read,parseEther:pe=parseEther}){
  await write('ShowproofBounty','create',['Fork-only verification','Local fixture; never published to mainnet',BigInt((await c.getBlock()).timestamp)+86400n],pe('0.001'));
  const id=await read('ShowproofBounty','bountyCount')-1n;await write('ShowproofBounty','cancel',[id]);await write('ShowproofBounty','withdraw');
  return {flow:'fund → cancel → withdraw'};
 },
};
