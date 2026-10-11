// Synthetic US3 review data only. Never reads or overwrites UI/data.
import { writeFile } from 'node:fs/promises';
const accounts=[],entries=[];
function account(id,name,type='BANK',inactive=false) {
  const a={id,name,type,currency:'USD',inactive,included:!inactive,openingBalanceCents:0,closingBalanceCents:0,balanceTimeline:null,children:[]};
  accounts.push(a);return a;
}
account('details-bank','Details Checking');account('salary','Salary:Paycheck','INCOME');
account('tax','Tax:Federal Income Tax','EXPENSE');account('dining','Personal:Dining:Dining Out','EXPENSE');
account('excluded','Archived Reserve','BANK',true);account('home','Home Savings');account('rainy','Rainy Day Savings');account('repairs','Home:Repairs','EXPENSE');
const allocation=(accountId,amountCents,memo='',tags=[])=>({accountId,name:accounts.find(a=>a.id===accountId).name,amountCents,memo,tags});
function entry(id,description,amount,allocations,accountId='details-bank',transactionId=id) {
  const own=entries.filter(e=>e.accountId===accountId),prior=own.at(-1)?.runningBalanceCents||0;
  entries.push({id,transactionId,accountId,date:'2026-09-01',registerOrder:own.length,description,memo:'',checkNum:'',clearedStatus:'CLEARED',amountCents:amount,runningBalanceCents:prior+amount,tags:[],allocations});
}
entry('paycheck','Employer LLC Payroll',200000,[allocation('salary',269000,'Employer LLC Direct Dep'),
  allocation('tax',-25000,'Federal Tax'),...[
  ['medicare','Tax:Medicare Tax',-15000,'Medicare Taxes'],['dental','Insurance:Dental',-3000,'Dental Insurance'],
  ['medical','Insurance:Health',-8000,'Medical Insurance'],['vision','Insurance:Vision',-500,'Vision Insurance'],
  ['social','Tax:Social Security Tax',-17500,'Social Security Tax']].map(([id,name,amount,memo])=>{account(id,name,'EXPENSE');return allocation(id,amount,memo)})]);
entry('repeated','Repeated Dining',-3000,[allocation('dining',-2000,'<img src=x onerror=alert(1)>',['One','A'.repeat(100)]),allocation('dining',-1000)]);
entry('legacy','Legacy partial amounts',-9200,[{accountId:'dining',name:'Dining',amountCents:null},allocation('excluded',-4200)]);
entry('empty','Uncategorized example',-1800,[]);
entry('many','Many allocations',-12000,Array.from({length:12},(_,i)=>allocation('dining',-1000,'Allocation '+(i+1),['Household'])));
entry('refund','Refund',2500,[allocation('dining',2500,'Refund')]);
entry('home-entry','Repair funding',-400000,[allocation('repairs',-400000,'Home contribution',['Home'])],'home','repair');
entry('rainy-entry','Repair funding',-100000,[allocation('repairs',-100000,'Rainy Day contribution',['Rainy'])],'rainy','repair');
entry('repair-entry','Repair funding',500000,[allocation('home',400000,'Home contribution',['Home']),allocation('rainy',100000,'Rainy Day contribution',['Rainy'])],'repairs','repair');
for(let i=0;i<100;i++)entry('filler-'+i,'Paging example '+i,-100,[allocation('dining',-100)]);
for(const a of accounts){a.closingBalanceCents=entries.filter(e=>e.accountId===a.id).at(-1)?.runningBalanceCents||0;if(a.included)a.balanceTimeline={points:[{date:'2026-09-05',ownBalanceCents:a.closingBalanceCents,sidebarBalanceCents:a.closingBalanceCents}]};}
const snapshot={schemaVersion:1,exportDate:'2026-09-06T12:00:00Z',balanceStartDate:'2026-09-05',sourceVersion:'synthetic-us3',accounts:{id:'root',name:'Synthetic Book',type:'ROOT',currency:'USD',inactive:false,included:false,openingBalanceCents:null,closingBalanceCents:null,balanceTimeline:null,children:accounts},entries};
await writeFile(new URL('../tests/fixtures/browsing-allocations-v1.json',import.meta.url),JSON.stringify(snapshot,null,2)+'\n');
