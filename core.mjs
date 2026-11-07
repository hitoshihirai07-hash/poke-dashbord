export function stats(base, points, nature=[1,1,1,1,1]) {
  return base.map((v,i)=>i===0 ? (Number(v)===1?1:Math.floor((2*Number(v)+31)/2)+Number(points[i])+60) : Math.floor((Math.floor((2*Number(v)+31)/2)+Number(points[i])+5)*nature[i-1]));
}
export function validPoints(p){return Array.isArray(p)&&p.length===6&&p.every(x=>Number.isInteger(x)&&x>=0&&x<=32)&&p.reduce((a,b)=>a+b,0)<=66}
export function abilityOptions(row){return [...new Set(['とくせい1','とくせい2','かくれとくせい'].map(k=>row?.[k]?.trim()).filter(Boolean))]}
export function setSpecies(p,name,row){if(p.species!==name){p.species=name;p.ability=abilityOptions(row)[0]||''}return p}
export function damage({level=50,power,attack,defense,stab=1,effectiveness=1}){
 const base=Math.floor(Math.floor(Math.floor((Math.floor(level*2/5)+2)*power*attack/defense)/50)+2);
 return Array.from({length:16},(_,i)=>Math.floor(Math.floor(Math.floor(base*(85+i)/100)*stab)*effectiveness));
}
export function parseCSV(s){
 s=s.replace(/^\uFEFF/,''); const rows=[]; let row=[],v='',quoted=false;
 for(let i=0;i<s.length;i++){const c=s[i]; if(quoted){if(c==='"'&&s[i+1]==='"'){v+='"';i++}else if(c==='"')quoted=false;else v+=c}else if(c==='"')quoted=true;else if(c===','){row.push(v);v=''}else if(c==='\n'){row.push(v.replace(/\r$/, ''));if(row.some(Boolean))rows.push(row);row=[];v=''}else v+=c}
 if(v||row.length){row.push(v.replace(/\r$/, ''));rows.push(row)}
 const headers=rows.shift()||[]; return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
export function validateBackup(o){
 const str=(x,k)=>typeof x[k]==='string';
 return !!o&&o.version===1&&Array.isArray(o.pokemon)&&Array.isArray(o.teams)&&Array.isArray(o.battles)
 &&o.pokemon.every(x=>x&&['id','species','nickname','nature','ability','item'].every(k=>str(x,k))&&validPoints(x.points)&&Array.isArray(x.moves)&&x.moves.length===4&&x.moves.every(v=>typeof v==='string'))
 &&o.teams.every(x=>x&&['id','name','memo'].every(k=>str(x,k))&&Array.isArray(x.members)&&x.members.length<=6&&x.members.every(v=>typeof v==='string'))
 &&o.battles.every(x=>x&&['id','date','result','team','opponent','memo'].every(k=>str(x,k)));
}
const types=['ノーマル','ほのお','みず','でんき','くさ','こおり','かくとう','どく','じめん','ひこう','エスパー','むし','いわ','ゴースト','ドラゴン','あく','はがね','フェアリー'];
const chart=[
 [[],['いわ','はがね'],['ゴースト']], [['くさ','こおり','むし','はがね'],['ほのお','みず','いわ','ドラゴン'],[]], [['ほのお','じめん','いわ'],['みず','くさ','ドラゴン'],[]], [['みず','ひこう'],['でんき','くさ','ドラゴン'],['じめん']], [['みず','じめん','いわ'],['ほのお','くさ','どく','ひこう','むし','ドラゴン','はがね'],[]], [['くさ','じめん','ひこう','ドラゴン'],['ほのお','みず','こおり','はがね'],[]], [['ノーマル','こおり','いわ','あく','はがね'],['どく','ひこう','エスパー','むし','フェアリー'],['ゴースト']], [['くさ','フェアリー'],['どく','じめん','いわ','ゴースト'],['はがね']], [['ほのお','でんき','どく','いわ','はがね'],['くさ','むし'],['ひこう']], [['くさ','かくとう','むし'],['でんき','いわ','はがね'],[]], [['かくとう','どく'],['エスパー','はがね'],['あく']], [['くさ','エスパー','あく'],['ほのお','かくとう','どく','ひこう','ゴースト','はがね','フェアリー'],[]], [['ほのお','こおり','ひこう','むし'],['かくとう','じめん','はがね'],[]], [['エスパー','ゴースト'],['あく'],['ノーマル']], [['ドラゴン'],['はがね'],['フェアリー']], [['エスパー','ゴースト'],['かくとう','あく','フェアリー'],[]], [['こおり','いわ','フェアリー'],['ほのお','みず','でんき','はがね'],[]], [['かくとう','ドラゴン','あく'],['ほのお','どく','はがね'],[]]
];
export function effectiveness(attack,defenders){const c=chart[types.indexOf(attack)]; if(!c)return 1;return defenders.filter(Boolean).reduce((v,t)=>v*(c[2].includes(t)?0:c[0].includes(t)?2:c[1].includes(t)?.5:1),1)}
