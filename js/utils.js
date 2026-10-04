export const DEBUG_MODE=false;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const randomInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
export const chance=p=>Math.random()<p;
export const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
export const deepClone=o=>JSON.parse(JSON.stringify(o));
export const formatNum=n=>Math.max(0,Math.round(Number(n)||0));
export function weightedPick(list){let t=list.reduce((s,x)=>s+x.weight,0),r=Math.random()*t;for(const x of list){r-=x.weight;if(r<=0)return x.value}return list[list.length-1].value}
