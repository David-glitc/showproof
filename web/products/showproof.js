import {$,config,state,esc,fmt,link,short,button,field,area,form,details,amount,read,tx,mine,chainTime,asset,start} from '../core.js';
const trim=v=>{const [a,b='']=v.split('.');return b?`${a}.${b.slice(0,4).replace(/0+$/,'')||'0'}`.replace(/\.0$/,''):a;};
const tally={open:0,onOffer:0n,proofs:0};
const box=(cls,inner)=>`<div class="f ${cls}">${inner}</div>`;
function controls(){
 $('list-title').textContent='Open bounties';
 $('controls').innerHTML='<div class="section-head"><h2>Post a bounty</h2><span class="tiny">Funds stay in the contract until you award a proof or cancel.</span></div>'
  +form('new-bounty',box('wide',field('title','What needs doing?','','text','maxlength="120" placeholder="Photo of the BOT Chain booth at your meetup"'))+box('',field('reward','Reward (BOT)','0.01','text','inputmode="decimal"'))+box('',field('days','Open for (days)','7','number','min="1" max="90"'))+box('full',area('description','Details and what counts as proof')),
   'Fund bounty',async f=>tx('ShowproofBounty','create',[f.title,f.description,BigInt(await chainTime()+Number(f.days)*86400)],amount(f.reward)));
 $('rules').innerHTML='<ul><li>The creator chooses the winner. There is no community vote.</li><li>Submit a public image or IPFS URL with your proof. Hosting is provided by your chosen image service.</li><li>With no claims, the creator can cancel. With claims, cancellation unlocks seven days after the deadline.</li><li>Winners withdraw their BOT after an award. No protocol fee.</li></ul>';
}
async function render(){
 const count=Number(await read('ShowproofBounty','bountyCount'));const nowMs=await chainTime()*1000;Object.assign(tally,{open:0,onOffer:0n,proofs:0});let top='';
 if(state.account){const credit=await read('ShowproofBounty','credit',[state.account]);if(credit>0n)top=`<p class="you">${trim(fmt(credit))} BOT is ready to withdraw. ${button('Withdraw payout',()=>tx('ShowproofBounty','withdraw'),true)}</p>`;}
 const ids=[];for(let id=count-1;id>=Math.max(0,count-30);id--)ids.push(id);
 const cards=await Promise.all(ids.map(async id=>{const [creator,reward,deadline,closed,title,description]=await read('ShowproofBounty','bounties',[BigInt(id)]);
  const total=Number(await read('ShowproofBounty','claimCount',[BigInt(id)]));tally.proofs+=total;const live=!closed&&Number(deadline)*1000>nowMs;if(!closed){tally.open++;tally.onOffer+=reward;}
  let html=`<article class="shot"><div class="shot-frame"><span class="badge${live?' live':''}">${closed?'Closed':live?'Open':'Judging'}</span><div class="amount">${trim(fmt(reward))} ${asset('BOT')}</div></div><h3>${esc(title)}</h3><p>${esc(description)}</p><p class="tiny">By ${link(creator)} · ${total} proof${total===1?'':'s'} · until ${new Date(Number(deadline)*1000).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</p>`;
  const proofs=[];for(let k=Math.max(0,total-20);k<total;k++)proofs.push(k);
  const claims=await Promise.all(proofs.map(k=>read('ShowproofBounty','getClaim',[BigInt(id),BigInt(k)])));
  claims.forEach((cl,k)=>{let url=cl.proofURI;if(url.startsWith('ipfs://'))url='https://ipfs.io/ipfs/'+url.slice(7);const safe=/^https?:\/\//.test(url);
   html+=details(`Proof #${proofs[k]} · ${esc(short(cl.creator))}`,`<p>${esc(cl.description)}</p>${safe?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">View proof ↗</a>`:'Unsupported proof URL'}${!closed&&mine(creator)?`<div class="actions">${button('Award this proof',()=>tx('ShowproofBounty','award',[BigInt(id),BigInt(proofs[k])]),true)}</div>`:''}`);});
  if(live&&!mine(creator))html+=details('Submit your proof',form(`proof-${id}`,field(`url-${id}`,'Public image or IPFS URL','','text','maxlength="500"')+area(`proof-note-${id}`,'Describe your proof'),'Submit proof',f=>tx('ShowproofBounty','submit',[BigInt(id),f[`url-${id}`],f[`proof-note-${id}`]])));
  if(!closed&&mine(creator)&&(total===0||nowMs>(Number(deadline)+604800)*1000))html+=`<div class="actions">${button('Cancel bounty',()=>tx('ShowproofBounty','cancel',[BigInt(id)]))}</div>`;
  return html+'</article>';}));
 return top+(cards.length?`<div class="wall">${cards.join('')}</div>`:'<p class="empty">No bounties yet. Post the first task above.</p>');
}
function stats(empty){return [['Open bounties',empty?'—':String(tally.open)],['BOT on offer',empty?'—':trim(fmt(tally.onOffer))],['Proofs',empty?'—':String(tally.proofs)]];}
start({controls,render,stats});
