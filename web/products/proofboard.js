import {$,config,state,esc,fmt,link,short,button,field,area,form,details,amount,read,tx,mine,chainTime,start} from '../core.js';
function controls(){
 $('list-title').textContent='Bounties';
 $('controls').innerHTML='<h2>Create a bounty</h2>'+form('new-bounty',field('title','What needs doing?','','text','maxlength="120"')+area('description','Details and acceptance criteria')+field('reward','Reward (BOT)','0.01','text','inputmode="decimal"')+field('days','Submission window (days)','7','number','min="1" max="90"'),'Fund bounty',async f=>tx('ProofBounty','create',[f.title,f.description,BigInt(await chainTime()+Number(f.days)*86400)],amount(f.reward)))+'<p class="tiny">Funds stay in the contract until you award a claim or cancel under the bounty rules.</p>';
 $('rules').innerHTML='<ul><li>The creator chooses the winner. There is no community vote.</li><li>Submit a public image or IPFS URL with your proof. Hosting is provided by your chosen image service.</li><li>With no claims, the creator can cancel. With claims, cancellation unlocks seven days after the deadline.</li><li>Winners withdraw their BOT after an award. No protocol fee.</li></ul>';
}
async function render(){
 const count=Number(await read('ProofBounty','bountyCount'));let html='';
 if(state.account){const credit=await read('ProofBounty','credit',[state.account]);if(credit>0n)html+=`<div class="item"><h3>${fmt(credit)} BOT ready to withdraw</h3>${button('Withdraw payout',()=>tx('ProofBounty','withdraw'),true)}</div>`;}
 for(let id=count-1;id>=Math.max(0,count-30);id--){const [creator,reward,deadline,closed,title,description]=await read('ProofBounty','bounties',[BigInt(id)]);
  html+=`<article class="item"><div class="section-head"><h3>${esc(title)}</h3><span class="badge">${closed?'Closed':'Open'}</span></div><div class="amount">${fmt(reward)} BOT</div><p>${esc(description)}</p><div class="tiny">By ${link(creator)} · Submissions until ${new Date(Number(deadline)*1000).toLocaleString()}</div>`;
  const total=Number(await read('ProofBounty','claimCount',[BigInt(id)]));
  for(let j=Math.max(0,total-20);j<total;j++){const c=await read('ProofBounty','getClaim',[BigInt(id),BigInt(j)]);let url=c.proofURI;if(url.startsWith('ipfs://'))url='https://ipfs.io/ipfs/'+url.slice(7);const safe=/^https?:\/\//.test(url);html+=`<details><summary>Proof #${j} · ${esc(short(c.creator))}</summary><p>${esc(c.description)}</p>${safe?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">View proof ↗</a>`:'Unsupported proof URL'}${!closed&&mine(creator)?`<div class="actions">${button('Award this proof',()=>tx('ProofBounty','award',[BigInt(id),BigInt(j)]),true)}</div>`:''}</details>`;}
  if(!closed&&Number(deadline)*1000>Date.now()&&!mine(creator))html+=details('Submit your proof',form(`proof-${id}`,field(`url-${id}`,'Public image or IPFS URL','','text','maxlength="500"')+area(`proof-note-${id}`,'Describe your proof'),'Submit claim',f=>tx('ProofBounty','submit',[BigInt(id),f[`url-${id}`],f[`proof-note-${id}`]])));
  if(!closed&&mine(creator)&&(total===0||Date.now()>(Number(deadline)+604800)*1000))html+=`<div class="actions">${button('Cancel bounty',()=>tx('ProofBounty','cancel',[BigInt(id)]))}</div>`;
  html+='</article>';
 }return html||'<p class="empty">No bounties yet. Fund the first task.</p>';
}
start({controls,render});
